A Modern CSS Reset
Source: A Modern CSS Reset by Josh W. Comeau
Published: November 23, 2021 | Last updated: June 3, 2026

Introduction
Whenever I start a new project, the first order of business is to sand down some of the rough edges in the CSS language. I do this with a functional set of custom baseline styles.

For a long time, I used Eric Meyer's famous CSS Reset. It's a solid chunk of CSS, but it's a bit long in the tooth at this point; it hasn't been updated in more than a decade, and a lot has changed since then!

Recently, I've been using my own custom CSS reset. It includes all of the little tricks I've discovered to improve both the user experience and the CSS authoring experience. Like other CSS resets, it's unopinionated when it comes to design/cosmetics. You can use this reset for any project, no matter the aesthetic you're going for.

The CSS Reset
css
/_ Josh's Custom CSS Reset
https://www.joshwcomeau.com/css/custom-css-reset/ _/

/_ 1. Use a more-intuitive box-sizing model _/
_, _::before, \*::after {
box-sizing: border-box;
}

/_ 2. Remove default margin _/
\*:not(dialog) {
margin: 0;
}

/_ 3. Enable keyword animations _/
@media (prefers-reduced-motion: no-preference) {
html {
interpolate-size: allow-keywords;
}
}

body {
/_ 4. Increase line-height _/
line-height: 1.5;
/_ 5. Improve text rendering _/
-webkit-font-smoothing: antialiased;
}

/_ 6. Improve media defaults _/
img, picture, video, canvas, svg {
display: block;
max-width: 100%;
}

/_ 7. Inherit fonts for form controls _/
input, button, textarea, select {
font: inherit;
}

/_ 8. Avoid text overflows _/
p, h1, h2, h3, h4, h5, h6 {
overflow-wrap: break-word;
}

/_ 9. Improve line wrapping _/
p {
text-wrap: pretty;
}
h1, h2, h3, h4, h5, h6 {
text-wrap: balance;
}

/_ 10. Create a root stacking context _/
#root, #\_\_next {
isolation: isolate;
}

Detailed Explanation

1. Box-sizing Model
   css
   _, _::before, \*::after {
   box-sizing: border-box;
   }
   By default, when you set width: 100% on an element, that percentage applies to the content box—not including padding or border. This leads to unexpected overflow issues. For example, a 200px-wide parent with a 100%-wide child that has 20px padding and 2px border would actually render at 244px wide, causing overflow.

With box-sizing: border-box, percentages resolve based on the border-box instead. The element's total visible width stays at 200px, and the content box shrinks to accommodate padding and border.

This rule applies to all elements and pseudo-elements (_::before and _::after), making it the default behavior. Contrary to popular belief, this is not bad for performance.

2. Remove Default Margin
   css
   \*:not(dialog) {
   margin: 0;
   }
   Several HTML tags come with default margin so that unstyled documents are legible. When styling your own projects, however, you want to control spacing yourself. Margin is a design concern, not something that should be applied by default.

Exception: The <dialog> element comes with margin: auto by default, which centers it within the viewport—a reasonable default. So it's excluded from this rule.

3. Enable Keyword Animations
   css
   @media (prefers-reduced-motion: no-preference) {
   html {
   interpolate-size: allow-keywords;
   }
   }
   Historically, animating between 0px and auto (e.g., for collapsible accordions) wasn't possible with CSS transitions—you needed JavaScript to measure heights. The new interpolate-size property fixes this by allowing transitions between absolute values (like 0px) and derived ones (like auto or fit-content).

Example usage:

css
.accordion {
height: 0px;
transition: height 300ms;
overflow: hidden;
}
.accordion[data-state="open"] {
height: auto;
}
Browser Support: As of March 2025, this is only supported in Chrome/Edge. The fallback—not having the animation—is perfectly acceptable for most use cases.

The declaration is placed within a prefers-reduced-motion media query to avoid causing problems for folks with motion sensitivities.

Note: Whenever possible, prefer transform: scale over height/width for size changes—it's more performant and produces smoother hardware-accelerated motion.

4. Increase Line-height
   css
   body {
   line-height: 1.5;
   }
   line-height controls vertical spacing between lines of text. Default values vary between browsers but tend to be around 1.2. When lines are too close together, text is harder to read, especially for folks who are dyslexic.

The consensus is that line-heights around 1.5 are friendlier for body text.

Headings with large type may require smaller line-height values, but those depend on the specific design and are not included in the reset.

5. Improve Text Rendering
   css
   body {
   -webkit-font-smoothing: antialiased;
   }
   On macOS, browsers use "subpixel antialiasing" by default, leveraging R/G/B lights within each pixel. However, on modern high-DPI "retina" displays, pixels are much smaller, and Apple disabled subpixel antialiasing system-wide in macOS Mojave (2018).

Confusingly, macOS browsers like Chrome and Safari still use subpixel antialiasing by default—we need to explicitly turn it off by setting -webkit-font-smoothing: antialiased.

This rule has no effect on Windows, Linux, or mobile devices—macOS is the only operating system that uses subpixel antialiasing.

6. Improve Media Defaults
   css
   img, picture, video, canvas, svg {
   display: block;
   max-width: 100%;
   }
   Images are considered "inline" elements by default, which causes mysterious gaps (the "inline magic space" from line-height) when used in layouts. Setting display: block sidesteps these issues.

max-width: 100% prevents large images from overflowing their containers. Media elements are "replaced elements" and don't follow the same sizing rules as block-level elements—an 800×600 image will render at 800px wide even inside a 500px container unless constrained.

7. Inherit Fonts for Form Controls
   css
   input, button, textarea, select {
   font: inherit;
   }
   By default, buttons and inputs don't inherit typographical styles from their parents. They use their own weird styles—monospace for <textarea>, sans-serif for text inputs, and a microscopically small font size (~13.333px in Chrome).

Small font sizes on mobile cause the browser to auto-zoom when focusing an input—a poor experience. To avoid this, inputs need a font size of at least 1rem / 16px.

Instead of a band-aid fix (font-size: 1rem), use font: inherit to make form controls match the typography of their surrounding environment.

8. Avoid Text Overflows
   css
   p, h1, h2, h3, h4, h5, h6 {
   overflow-wrap: break-word;
   }
   By default, text wraps only at "soft wrap opportunities" (whitespace and hyphens in English). If a line has no such opportunities and doesn't fit, it causes overflow—horizontal scrollbars or overlapping elements.

overflow-wrap: break-word gives the algorithm permission to use hard wraps when no soft wrap opportunities can be found, preventing layout issues.

You can also try adding hyphens: auto to use hyphens (in supported languages) to indicate hard wraps, though it can be distracting for some use cases.

9. Improve Line Wrapping
   css
   p {
   text-wrap: pretty;
   }
   h1, h2, h3, h4, h5, h6 {
   text-wrap: balance;
   }
   The default line-wrapping algorithm sometimes produces awkward results—like a paragraph ending with an emoji pushed to its own line.

text-wrap: pretty (for paragraphs): Ensures the final line has at least two words and makes other subtle tweaks to improve visual balance.

text-wrap: balance (for headings): Tries to make each line roughly the same length, making two-line headings feel more balanced.

Browser Support (as of November 2024): pretty at ~72% support, balance at ~87% support. For progressive enhancements like this, we don't need to worry about perfect browser support.

10. Root Stacking Context
    css
    #root, #\_\_next {
    isolation: isolate;
    }
    This last one is optional and generally only needed if you use a JS framework like React.

The isolation property creates a new stacking context without needing to set a z-index. This guarantees that high-priority elements (modals, dropdowns, tooltips) always show above other elements—no weird stacking context bugs, no z-index arms race.

Tweak the selector to match your framework. For example, create-react-app uses <div id="root">, so the selector is #root. Next.js uses #\_\_next.

Changelog
March 2026 — Update the line-height explanation to correctly describe the WCAG requirements.

December 2025 — Excluded the <dialog> tag from the margin-stripping rule.

March 2025 — Added the interpolate-size property to enable animations to auto / fit-content / etc.

October 2024 — Added #8, improved line wrapping with text-wrap.

June 2023 — Removed the height: 100% from html and body. This rule was added to make percentage-based heights possible. Now that dynamic viewport units are well-supported, this hacky fix is no longer required.

License & Usage
Feel free to copy/paste this into your own projects! It's released without any restrictions, into the public domain (though if you wanted to keep the link to this blog post, I'd appreciate it!).

I chose not to release this CSS reset as an NPM package because I feel like you should own your reset. Bring this into your project, and tweak it over time as you learn new things or discover new tricks.

You own this code, and it should grow along with you.

Credits & Further Reading
Thanks to Andy Bell for sharing his Modern CSS Reset—it helped tune some of my thinking and inspired this blog post.

This document is a comprehensive extraction and documentation of Josh W. Comeau's "A Modern CSS Reset" blog post, preserving all rules, explanations, and context for easy reference.
