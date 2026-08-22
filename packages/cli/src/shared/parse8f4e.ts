import { parseProjectSource } from '@8f4e/compiler';
import type { ProjectObjectModel } from '@8f4e/language-spec';

export default function parse8f4eToProject(source: string): ProjectObjectModel {
	return parseProjectSource(source);
}
