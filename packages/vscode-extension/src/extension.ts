import * as vscode from 'vscode';

const VIEW_TYPE = '8f4e.editor';

type WebviewRequestMessage = {
	type: 'request';
	id: string;
	command: 'importProject' | 'exportText' | 'exportBytes';
	fileName?: string;
	text?: string;
	bytes?: number[];
};

type WebviewDocumentChangedMessage = {
	type: 'documentChanged';
	text: string;
};

type WebviewReadyMessage = {
	type: 'ready';
};

type WebviewMessage = WebviewDocumentChangedMessage | WebviewReadyMessage | WebviewRequestMessage;

export function activate(context: vscode.ExtensionContext): void {
	const provider = new EightF4eEditorProvider(context);

	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
			supportsMultipleEditorsPerDocument: false,
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('8f4e.openInEditor', async (uri?: vscode.Uri) => {
			const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
			if (!targetUri) {
				await vscode.window.showWarningMessage('Open an .8f4e file before launching the 8f4e editor.');
				return;
			}

			await vscode.commands.executeCommand('vscode.openWith', targetUri, VIEW_TYPE);
		})
	);
}

export function deactivate(): void {}

class EightF4eEditorProvider implements vscode.CustomTextEditorProvider {
	constructor(private readonly context: vscode.ExtensionContext) {}

	resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void {
		let applyingWebviewEdit = false;
		let ready = false;

		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor')],
		};
		webviewPanel.webview.html = this.renderHtml(webviewPanel.webview);

		const postDocument = () => {
			if (!ready) {
				return;
			}

			webviewPanel.webview.postMessage({
				type: 'loadDocument',
				text: document.getText(),
				fileName: getFileName(document.uri),
			});
		};

		const documentChangeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document.uri.toString() !== document.uri.toString() || applyingWebviewEdit) {
				return;
			}

			postDocument();
		});

		webviewPanel.onDidDispose(() => documentChangeSubscription.dispose());

		webviewPanel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
			switch (message.type) {
				case 'ready':
					ready = true;
					postDocument();
					break;

				case 'documentChanged':
					if (message.text === document.getText()) {
						return;
					}

					applyingWebviewEdit = true;
					try {
						await replaceDocumentText(document, message.text);
					} finally {
						applyingWebviewEdit = false;
					}
					break;

				case 'request':
					await this.handleRequest(message, document, webviewPanel.webview);
					break;
			}
		});
	}

	private async handleRequest(
		message: WebviewRequestMessage,
		document: vscode.TextDocument,
		webview: vscode.Webview
	): Promise<void> {
		try {
			const payload = await this.resolveRequest(message, document);
			await webview.postMessage({ type: 'response', id: message.id, ok: true, payload });
		} catch (error) {
			const text = error instanceof Error ? error.message : String(error);
			await webview.postMessage({ type: 'response', id: message.id, ok: false, error: text });
			await vscode.window.showErrorMessage(text);
		}
	}

	private async resolveRequest(message: WebviewRequestMessage, document: vscode.TextDocument): Promise<unknown> {
		switch (message.command) {
			case 'importProject':
				return await this.importProject();

			case 'exportText':
				return await this.exportBytes(
					document.uri,
					message.fileName ?? getFileName(document.uri),
					Buffer.from(message.text ?? '', 'utf8')
				);

			case 'exportBytes':
				return await this.exportBytes(
					document.uri,
					message.fileName ?? '8f4e-export.bin',
					Buffer.from(message.bytes ?? [])
				);
		}
	}

	private async importProject(): Promise<string | null> {
		const uris = await vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false,
			filters: {
				'8f4e Projects': ['8f4e'],
			},
		});

		const uri = uris?.[0];
		if (!uri) {
			return null;
		}

		const bytes = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(bytes).toString('utf8');
	}

	private async exportBytes(sourceUri: vscode.Uri, fileName: string, bytes: Uint8Array): Promise<string | null> {
		const targetUri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.joinPath(sourceUri, '..', fileName),
		});

		if (!targetUri) {
			return null;
		}

		await vscode.workspace.fs.writeFile(targetUri, bytes);
		return targetUri.toString();
	}

	private renderHtml(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor', 'editor.js')
		);
		const csp = [
			`default-src * data: blob: ${webview.cspSource}`,
			'connect-src * data: blob:',
			'font-src * data: blob:',
			'frame-src * data: blob:',
			'img-src * data: blob:',
			'media-src * data: blob:',
			"script-src * 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' data: blob:",
			"style-src * 'unsafe-inline'",
			`worker-src * data: blob: ${webview.cspSource}`,
		].join('; ');

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<meta http-equiv="Content-Security-Policy" content="${csp};">
	<title>8f4e Editor</title>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
			-webkit-user-select: none;
			-webkit-touch-callout: none;
		}

		html,
		body,
		#app,
		canvas {
			width: 100%;
			height: 100%;
			overflow: hidden;
			background: #000;
		}

		canvas {
			display: block;
			image-rendering: pixelated;
		}
	</style>
</head>
<body>
	<div id="app">
		<canvas id="glcanvas"></canvas>
	</div>
	<script type="module" src="${scriptUri}"></script>
</body>
</html>`;
	}
}

async function replaceDocumentText(document: vscode.TextDocument, text: string): Promise<void> {
	const edit = new vscode.WorkspaceEdit();
	const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
	edit.replace(document.uri, fullRange, text);
	await vscode.workspace.applyEdit(edit);
}

function getFileName(uri: vscode.Uri): string {
	return uri.path.split('/').pop() || 'project.8f4e';
}
