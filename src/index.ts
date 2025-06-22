import type { Plugin, PluginOption } from 'vite';
import { DomUtils, parseDocument } from 'htmlparser2';
import { Element } from 'domhandler';
import render from 'dom-serializer';
import spliceString from './utils/spliceString';

export type Rewrite = {
	order?: 'pre' | 'post';
	match: (element: Element) => boolean;
	render: (
		elementDetails: Pick<
			Element,
			| 'attribs'
			| 'attributes'
			| 'name'
			| 'namespace'
			| 'nodeType'
			| 'startIndex'
			| 'endIndex'
			| 'tagName'
			| 'type'
			| 'x-attribsNamespace'
			| 'x-attribsPrefix'
		> & { innerHTML: string },
		index: number,
	) => false | undefined | null | string;
};

export function rewriteHTML(rewrites: Rewrite[]): PluginOption {
	const plugins: Plugin[] = [];

	function handleTransform(input: string, rewrites: Rewrite[]) {
		const doc = parseDocument(input, {
			xmlMode: true,
			lowerCaseAttributeNames: false,
			lowerCaseTags: false,
			recognizeSelfClosing: true,
			withEndIndices: true,
			withStartIndices: true,
		});

		const matches: {
			start: number;
			end: number;
			render: string;
		}[] = [];

		rewrites.forEach((rewrite) => {
			let element: Element | null = null;
			let i = 0;
			while ((element = DomUtils.findOne(rewrite.match, doc)) !== null) {
				const innerHTML = render(element.children, {
					xmlMode: false,
					encodeEntities: false,
					emptyAttrs: true,
				});
				const rewrittenInnerHTML = innerHTML
					? handleTransform(innerHTML, rewrites)
					: '';

				const offset = rewrittenInnerHTML.length - innerHTML.length;

				const out =
					rewrite.render(
						{
							attribs: element.attribs,
							attributes: element.attributes,
							name: element.name,
							namespace: element.namespace,
							nodeType: element.nodeType,
							startIndex: element.startIndex!,
							endIndex: element.endIndex! + offset,
							tagName: element.tagName,
							type: element.type,
							'x-attribsNamespace': element['x-attribsNamespace'],
							'x-attribsPrefix': element['x-attribsPrefix'],
							innerHTML: rewrittenInnerHTML,
						},
						i,
					) || '';

				matches.push({
					start: element.startIndex!,
					end: element.endIndex!,
					render: out,
				});

				DomUtils.removeElement(element);

				i++;
			}
		});

		let output = input;

		matches.sort((a, b) => b.start - a.start);

		matches.forEach(({ start, end, render }) => {
			const currentLength = end - start + 1;

			output = spliceString(output, start, currentLength, render);
		});

		return output;
	}

	function handlePluginOrder(rewrites: Rewrite[], order: 'pre' | 'post') {
		if (!rewrites.length) {
			return;
		}

		const plugin: Plugin = {
			name: 'rewriteHTML',
			transform(code, id, options) {
				if (id.endsWith('.html')) {
					return {
						code: handleTransform(code, rewrites),
					};
				}
			},
			transformIndexHtml: {
				order,
				enforce: order,
				handler(html, ctx) {
					const out = handleTransform(html, rewrites);

					return out;
				},
			},
		};

		(['serve', 'build'] as const).map((item) => {
			plugins.push({
				...plugin,
				name: `${plugin.name}-${item}`,
				apply: item,
			});
		});
	}

	(['pre', 'post'] as const).map((item) =>
		handlePluginOrder(
			rewrites.filter(({ order = 'pre' }) => order === item),
			item,
		),
	);

	return plugins;
}

export default rewriteHTML;
