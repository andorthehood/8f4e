import { WASM_TYPE_F32, WASM_TYPE_F64, WASM_TYPE_I32 } from '@8f4e/compiler-wasm-utils';
import type {
	AST,
	AssertionCodegenSites,
	AssertionImport,
	AssertionSite,
	FunctionTypeRegistry,
} from '@8f4e/language-spec';
import { ASSERTION_IMPORT_NAMES, DEFAULT_HOST_IMPORT_MODULE_NAME } from '@8f4e/language-spec';
import type { ComposedProgram } from '@8f4e/program-composer/internal';
import type { SemanticReferenceReport } from '@8f4e/semantic-reference-resolver';
import type { StackAnalysisSubProgramReport } from '@8f4e/stack-analyzer';
import { getOrRegisterFunctionType } from '@8f4e/wasm-codegen';

interface AssertionPlan {
	imports: AssertionImport[];
	sites: AssertionSite[];
	calls: Map<AST, AssertionCodegenSites>;
}

/** Plans typed assertion imports and source sites after operand analysis, before final function index assignment. */
export function planAssertions(
	program: ComposedProgram,
	references: SemanticReferenceReport,
	stackReport: StackAnalysisSubProgramReport,
	types: FunctionTypeRegistry,
	importedUserFunctionCount: number
): AssertionPlan {
	const plan: AssertionPlan = { imports: [], sites: [], calls: new Map() };
	const importsByName = new Map<string, AssertionImport>();
	const blocks = [...Object.values(references.modules), ...Object.values(references.functions)];
	for (const block of blocks) {
		const { ast, body } = block;
		const report = 'metadata' in block ? stackReport.functions[block.metadata.id] : stackReport.modules[block.ast.id];
		const calls = new Map<number, { siteId: number; wasmIndex: number }>();
		for (const { sourceLineIndex, line } of body) {
			if (line.instruction !== 'assert' && line.instruction !== 'assertEqual') continue;
			const valueType = report.lineFacts[sourceLineIndex]!.stackAnalysis.consumedOperands[0].valueType;
			const fieldName =
				line.instruction === 'assert' ? ASSERTION_IMPORT_NAMES.assert : ASSERTION_IMPORT_NAMES.assertEqual[valueType];
			let imported = importsByName.get(fieldName);
			if (!imported) {
				const operandType =
					valueType === 'int' ? WASM_TYPE_I32 : valueType === 'float64' ? WASM_TYPE_F64 : WASM_TYPE_F32;
				imported = {
					moduleName: DEFAULT_HOST_IMPORT_MODULE_NAME,
					fieldName,
					wasmIndex: importedUserFunctionCount + plan.imports.length,
					typeIndex: getOrRegisterFunctionType(types, {
						params:
							line.instruction === 'assert'
								? [WASM_TYPE_I32, WASM_TYPE_I32]
								: [operandType, operandType, WASM_TYPE_I32],
						results: [],
					}),
				};
				plan.imports.push(imported);
				importsByName.set(fieldName, imported);
			}
			const origin = program.sourceIdentities.get(ast)!;
			const siteId = plan.sites.length;
			plan.sites.push({
				siteId,
				instruction: line.instruction,
				...origin,
				codeBlockType: ast.type,
				...('metadata' in block ? { functionId: block.metadata.id } : {}),
				lineNumber: line.lineNumber,
				...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
				...(ast.source ? { source: { ...ast.source, symbolName: origin.codeBlockId } } : {}),
			});
			calls.set(line.lineNumber, { siteId, wasmIndex: imported.wasmIndex });
		}
		plan.calls.set(ast, calls);
	}
	return plan;
}
