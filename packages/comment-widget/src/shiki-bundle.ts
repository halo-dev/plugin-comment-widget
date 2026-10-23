import githubDark from '@shikijs/themes/github-dark';
import {
  type CodeToHastOptions,
  type CreateHighlighterFactory,
  createBundledHighlighter,
  createSingletonShorthands,
  guessEmbeddedLanguages,
  type ShorthandsBundle,
  type ThemeRegistration,
} from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { bundledLanguages } from 'shiki/langs';

type BundledLanguage = keyof typeof bundledLanguages;
type BundledTheme = 'github-dark';

const bundledThemes: Record<BundledTheme, ThemeRegistration> = {
  'github-dark': githubDark,
};

const createHighlighter: CreateHighlighterFactory<
  BundledLanguage,
  BundledTheme
> = createBundledHighlighter({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () => createJavaScriptRegexEngine(),
});

const shorthands: ShorthandsBundle<BundledLanguage, BundledTheme> =
  createSingletonShorthands(createHighlighter, { guessEmbeddedLanguages });

function codeToHtml(
  code: string,
  options: CodeToHastOptions<BundledLanguage, BundledTheme>
): Promise<string> {
  return shorthands.codeToHtml(code, options);
}

export { bundledLanguages, bundledThemes, codeToHtml, createHighlighter };
