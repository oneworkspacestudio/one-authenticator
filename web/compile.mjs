import { readFileSync, writeFileSync } from 'node:fs';
import { parse, compileReact } from '@codedia/parser';
const output = compileReact(parse(readFileSync('src/App.aui', 'utf8')));
writeFileSync('src/Screen.tsx', output.replaceAll('@/components/ui', './ui'));
