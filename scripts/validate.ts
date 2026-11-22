import { TEST_CARDS, TEST_ENDINGS } from '../data/test-content.ts';
import { printIssues, validateContent } from '../src/validate.ts';

const ok = printIssues(validateContent(TEST_CARDS, TEST_ENDINGS));
console.log(`карток: ${TEST_CARDS.length}, фіналів: ${TEST_ENDINGS.length}`);
process.exitCode = ok ? 0 : 1;
