import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { PACKS, packWords } from '../docs/packs.mjs';
import { WORDS } from '../docs/data/everyday.mjs';
import { newGame, validateWords } from '../docs/engine.mjs';

test('Every pack has a distinct ID and at least 200 unique valid words', () => {
  assert.equal(new Set(PACKS.map(pack => pack.id)).size, PACKS.length);
  for (const pack of PACKS) {
    assert.ok(pack.name && pack.description && pack.icon && pack.tag, pack.id);
    assert.ok(pack.words.length >= 200, pack.id);
    assert.equal(new Set(pack.words).size, pack.words.length, pack.id);
    for (const word of pack.words) {
      assert.match(word, /^[A-Z0-9][A-Z0-9 '-]{0,23}$/, `${pack.id}: ${word}`);
      assert.equal(word.trim(), word);
    }
    validateWords(pack.words);
  }
});

test('Original packs and the complete everyday list remain available', () => {
  assert.deepEqual(packWords('everyday'), WORDS);
  const originalCounts = {
    everyday: 354, halloween: 300, tech: 330, food: 300, adventure: 300, holiday: 310
  };
  for (const [id, count] of Object.entries(originalCounts)) {
    assert.equal(packWords(id).length, count, id);
  }
});

test('Every pack has explicit, distinct curated difficulty pools suitable for a board', () => {
  for (const pack of PACKS) {
    const easy = packWords(pack, 'easy');
    const hard = packWords(pack, 'hard');
    assert.strictEqual(packWords(pack), pack.words);
    assert.strictEqual(packWords(pack, 'standard'), pack.words);
    for (const difficulty of ['easy', 'hard']) {
      const words = packWords(pack, difficulty);
      assert.strictEqual(words, pack.difficulties[difficulty]);
      assert.strictEqual(packWords(pack.id, difficulty), words);
      assert.ok(words.length >= 50, `${pack.id} ${difficulty}`);
      assert.ok(words.length < pack.words.length, `${pack.id} ${difficulty}`);
      assert.equal(new Set(words).size, words.length);
      assert.ok(words.every(word => pack.words.includes(word)), pack.id);
      validateWords(words);
      const teams = {
        red: {name: 'Red', master: 'R', players: ['One']},
        blue: {name: 'Blue', master: 'B', players: ['Two']}
      };
      const game = newGame(words, teams, `${pack.id} ${difficulty}`);
      assert.equal(new Set(game.cards.map(card => card.word)).size, 25);
      assert.ok(game.cards.every(card => words.includes(card.word)));
    }
    assert.notDeepEqual(easy, hard, pack.id);
    assert.ok(easy.every(word => !hard.includes(word)), pack.id);
  }
});

test('Difficulty is semantic curation, with familiar long words and specialist short words', () => {
  const examples = {
    everyday: ['BICYCLE', 'AXLE'],
    halloween: ['CHOCOLATE', 'HEX'],
    tech: ['TOUCHSCREEN', 'HEAP'],
    food: ['WATERMELON', 'BRINE'],
    adventure: ['FLASHLIGHT', 'ATOLL'],
    holiday: ['SNOWBALL', 'GELT'],
    federal: ['CHECKLIST', 'ATO'],
    nature: ['BUTTERFLY', 'XYLEM'],
    science: ['MICROSCOPE', 'REDOX'],
    arts: ['AUDIENCE', 'HUE'],
    sports: ['WHISTLE', 'KOMI'],
    celebrations: ['INVITATION', 'NIA']
  };
  for (const [id, [easy, hard]] of Object.entries(examples)) {
    assert.ok(packWords(id, 'easy').includes(easy), `${id}: ${easy}`);
    assert.ok(!packWords(id, 'hard').includes(easy), id);
    assert.ok(packWords(id, 'hard').includes(hard), `${id}: ${hard}`);
    assert.ok(!packWords(id, 'easy').includes(hard), id);
    assert.ok(easy.length > hard.length, id);
  }
});

test('Six substantial new themes include real federal delivery vocabulary', () => {
  for (const id of ['federal', 'nature', 'science', 'arts', 'sports', 'celebrations']) {
    assert.ok(packWords(id).length >= 200, id);
  }
  const federal = packWords('federal');
  for (const word of [
    'SALESFORCE', 'COPADO', 'GITHUB', 'APEX', 'SOQL', 'SOSL', 'LWC',
    'FLOW', 'SANDBOX', 'SCRATCH ORG', 'GOVERNMENT CLOUD', 'PERMISSION SET',
    'COPADO PIPELINE', 'PROMOTION', 'BACK PROMOTION', 'COPADO ROBOTIC TESTING',
    'PULL REQUEST', 'GITHUB ACTIONS', 'CODEOWNERS', 'BRANCH PROTECTION',
    'CODEQL', 'DEPENDABOT', 'FEDRAMP', 'FISMA', 'NIST 800-53', 'ATO',
    'SECTION 508', 'CUI', 'PIV', 'CAC', 'ZERO TRUST', 'LEAST PRIVILEGE'
  ]) assert.ok(federal.includes(word), word);
});

test('Celebrations include multiple faiths, regions, and secular communities', () => {
  const words = packWords('celebrations');
  for (const word of [
    'DIWALI', 'EID AL-FITR', 'HANUKKAH', 'CHRISTMAS', 'VESAK', 'VAISAKHI',
    'NOWRUZ', 'LUNAR NEW YEAR', 'TET', 'CHUSEOK', 'MATARIKI', 'INTI RAYMI',
    'KWANZAA', 'JUNETEENTH', 'PRIDE', 'POWWOW', 'TIMKAT'
  ]) assert.ok(words.includes(word), word);
});

test('Unknown difficulties use standard and uncurated custom pools remain untouched', () => {
  assert.strictEqual(packWords(PACKS[0], 'unknown'), PACKS[0].words);
  assert.deepEqual(packWords('missing'), []);
  assert.deepEqual(packWords(undefined), []);
  const custom = {words: ['FIRST WORD', 'SECOND WORD']};
  for (const difficulty of ['easy', 'standard', 'hard']) {
    assert.strictEqual(packWords(custom, difficulty), custom.words);
  }
});

test('Pack declarations do not collide in the offline single-scope bundle', async () => {
  const modules = ['data/everyday', 'engine', 'packs', 'themes', 'app'];
  const sources = await Promise.all(modules.map(name =>
    readFile(new URL(`../docs/${name}.mjs`, import.meta.url), 'utf8')
  ));
  const strip = source => source.replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '');
  assert.doesNotThrow(() => new Script(`(()=>{\n${sources.map(strip).join('\n')}\n})();`));
});
