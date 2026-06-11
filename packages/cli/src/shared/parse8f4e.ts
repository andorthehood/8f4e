import { type ProjectDocument, parseProjectSource } from '@8f4e/project-preparser';

export default function parse8f4eToProject(source: string): ProjectDocument {
	return parseProjectSource(source);
}
