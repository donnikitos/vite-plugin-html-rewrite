import type { Plugin, PluginOption } from 'vite';
import { DomUtils, parseDocument } from 'htmlparser2';
import { Element, Text, ProcessingInstruction, type AnyNode } from 'domhandler';
import render, { type DomSerializerOptions } from 'dom-serializer';

const serializeOptions: DomSerializerOptions = {
	xmlMode: true,
	selfClosingTags: true,
	encodeEntities: false,
	emptyAttrs: true,
};

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
			xmlMode: !!serializeOptions.xmlMode,
			lowerCaseAttributeNames: false,
			lowerCaseTags: false,
			recognizeSelfClosing: true,
			withEndIndices: true,
			withStartIndices: true,
		});

		rewrites.forEach((rewrite) => {
			DomUtils.findAll(rewrite.match, doc).forEach((element, i) => {
				const out = rewrite.render(
					{
						attribs: element.attribs,
						attributes: element.attributes,
						name: element.name,
						namespace: element.namespace,
						nodeType: element.nodeType,
						startIndex: element.startIndex,
						tagName: element.tagName,
						type: element.type,
						'x-attribsNamespace': element['x-attribsNamespace'],
						'x-attribsPrefix': element['x-attribsPrefix'],
						innerHTML: render(element.children, serializeOptions),
					},
					i,
				);

				if (out) {
					let node: AnyNode = new Text(out);
					if (out.startsWith('<') && out.endsWith('>')) {
						node = new ProcessingInstruction(
							'custom-code',
							out.substring(1, out.length - 1),
						);
					}

					DomUtils.replaceElement(element, node);
				} else {
					DomUtils.removeElement(element);
				}
			});
		});

		return render(doc, serializeOptions);
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
