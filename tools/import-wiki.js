#!/usr/bin/env node
/*
	import-wiki.js — 把源目录里的笔记同步进博客的「知识库」板块。

	零依赖（只用 Node 内置模块），可重复运行。站点本身不需要构建，
	这个脚本只在「源笔记有更新、需要重新同步」时手动跑一次。

	用法：
		node tools/import-wiki.js

	做三件事：
	  1. 复制各分区的 .md 到 wiki/<分区>/…（保留目录结构，原样复制，含 front-matter）
	  2. 复制 _assets/ 到 wiki/_assets/
	  3. 生成 assets/js/wiki-data.js —— 树清单，供浏览器端 wiki.js 渲染

	内容源见 SOURCES：

	  D:/ctf    Web 安全笔记。只导入「两位数字 + 连字符」开头的分区目录
	            （00-基础 … 14-工具与环境），RCE/ base/ 等未整理的原始目录自动排除。
	            顶层的 web知识/ 是**容器目录**：目录真实存在，但它自己不装笔记，
	            只是 02…12 这 10 个分区的归类。分区 id 带上容器名（web知识/02-SQL注入），
	            所以 wiki/ 下也照样有一层 web知识/。

	  D:/工控    工控（ICS/OT）协议与设备笔记，9 个分区 42 篇。这 9 个分区统一收进
	            一个「工控安全」容器里，在网页上与 web知识 同级。源目录没有动，
	            容器是脚本合成的（见 SOURCES 的 group），因此没有 wiki/工控安全/ 这一层。

	  D:/蜜罐    蜜罐与欺骗防御笔记，5 个分区 30 篇，同样收进合成容器「蜜罐研究」，
	            紧跟在「工控安全」后面。

	树里所有分区都去掉「数字-」前缀显示（基础、信息收集、Modbus …），但 id 与
	文件路径保留前缀，和源目录逐字对应——编号在源目录里仍是排序依据，只是不显示。

	注意：每次运行都会先整个删除并重建 wiki/，所以**不要往 wiki/ 里手写内容**，
	那个目录是源笔记的投影。要加笔记，请加到源目录后重跑本脚本。

	对应关系：源目录的目录结构调整后，这里只需改 SOURCES。
*/

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WIKI_DIR = path.join(ROOT, 'wiki');
const OUT_JS = path.join(ROOT, 'assets/js/wiki-data.js');

const PARTITION_RE = /^\d{2}-/;

/*
	内容源，数组顺序即它们贡献的顶层节点在树里的先后。

	  dir         源目录，只读，不入库
	  containers  该源里当「容器」用的目录名：目录真实存在，但它自己不是分区，
	              只是若干分区的归类
	  group       把该源扫出来的分区整体再收进一个合成容器（源目录里没有这层）
	  after       合成容器排在哪个顶层节点之后；锚点必须来自先处理的源

	几个源的编号都从 00 起，所以合成容器不能按编号自动落位，得逐个给 after 串起来
	（web知识 → 工控安全 → 蜜罐研究）。
*/
const SOURCES = [
	{ dir: 'D:/ctf', containers: ['web知识'] },
	{ dir: 'D:/工控', group: '工控安全', after: 'web知识' },
	{ dir: 'D:/蜜罐', group: '蜜罐研究', after: '工控安全' }
];

// Windows 路径转成网页用的正斜杠路径
const toPosix = p => p.split(path.sep).join('/');

function fail(message) {
	console.error(message);
	process.exit(1);
}

/* ---------- front-matter ---------- */

// 解析笔记开头的 YAML front-matter。只支持本项目用到的简单子集：
// 标量、数字、以及 [a, b, c] 形式的行内数组。
function parseFrontMatter(text) {
	const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
	if (!m) return {};

	const data = {};
	for (const line of m[1].split(/\r?\n/)) {
		const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
		if (!kv) continue;

		const key = kv[1];
		const raw = kv[2].trim();

		if (raw.startsWith('[') && raw.endsWith(']')) {
			data[key] = raw.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
		} else if (/^\d+$/.test(raw)) {
			data[key] = Number(raw);
		} else {
			data[key] = raw.replace(/^["']|["']$/g, '');
		}
	}
	return data;
}

/* ---------- 复制 ---------- */

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

// wiki/ 每次都是重建的，所以目标已存在只可能是两个源撞了同一个路径——
// 静默覆盖会让树里两篇笔记指向同一份正文，直接报错让人去改目录名。
function copyFile(from, to) {
	ensureDir(path.dirname(to));
	if (fs.existsSync(to)) fail('两个源的文件路径撞车：' + path.relative(WIKI_DIR, to));
	fs.copyFileSync(from, to);
}

/* ---------- 扫描 ---------- */

// 递归扫描一个目录：
//   直接属于它的 .md → notes（按 front-matter order 升序，order 相同或缺失则按文件名）
//   子目录 → groups（按目录名升序），递归下去；groups 排在 notes 之后
// 这样与 README 里的编号顺序一致（如 01-信息收集 的 1-4 是正文，5-6 在 爆破/ 子目录）。
function scanDir(absDir, relDir) {
	const entries = fs.readdirSync(absDir, { withFileTypes: true });
	const notes = [];
	const groups = [];

	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'zh'))) {
		const abs = path.join(absDir, entry.name);

		if (entry.isDirectory()) {
			groups.push({
				id: toPosix(relDir ? path.join(relDir, entry.name) : entry.name),
				title: entry.name,
				children: scanDir(abs, relDir ? path.join(relDir, entry.name) : entry.name)
			});
		} else if (entry.name.toLowerCase().endsWith('.md')) {
			const relFile = relDir ? path.join(relDir, entry.name) : entry.name;
			const fm = parseFrontMatter(fs.readFileSync(abs, 'utf8'));
			const base = entry.name.replace(/\.md$/i, '');

			notes.push({
				id: toPosix(relFile).replace(/\.md$/i, ''),
				title: fm.title || base,
				path: toPosix(relFile),
				order: typeof fm.order === 'number' ? fm.order : null,
				tags: Array.isArray(fm.tags) ? fm.tags : [],
				source: fm.source || ''
			});
		}
	}

	notes.sort((a, b) => {
		const ao = a.order === null ? Number.MAX_SAFE_INTEGER : a.order;
		const bo = b.order === null ? Number.MAX_SAFE_INTEGER : b.order;
		return ao - bo || a.title.localeCompare(b.title, 'zh');
	});

	return notes.concat(groups);
}

/* ---------- 主流程 ---------- */

// 生成一个分区节点。id / 文件路径都用真实相对路径（含数字前缀，与源目录逐字对应），
// 只有 title 去掉「数字-」前缀——编号在源目录里还承担排序作用，但没必要显示给人看。
function partitionNode(srcDir, relDir) {
	const children = scanDir(path.join(srcDir, relDir.split('/').join(path.sep)), relDir);
	for (const node of children) {
		collectAndCopy(srcDir, node);
	}
	const id = toPosix(relDir);
	return { id, title: id.split('/').pop().replace(PARTITION_RE, ''), children };
}

// 容器目录：id、显示名都用目录名本身，同名分区不重复前缀。
function containerNode(srcDir, name) {
	const members = fs.readdirSync(path.join(srcDir, name), { withFileTypes: true })
		.filter(e => e.isDirectory() && PARTITION_RE.test(e.name))
		.map(e => e.name)
		.sort();

	const numbers = members.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
	return {
		id: name,
		title: name,
		// 容器落在这一组分区本该在的位置上（web知识 里是 02…12，就排在 01 之后）
		order: numbers.length ? Math.min.apply(null, numbers) - 0.5 : Number.MAX_SAFE_INTEGER,
		children: members.map(member => partitionNode(srcDir, name + '/' + member))
	};
}

// 扫一个源，把它的顶层节点推进 tree。
// 带 group 的源多包一层容器；容器要排在 after 指的节点之后，所以锚点必须已经在 tree 里
// （即来自先处理的源）。
function buildSource(src, tree) {
	const dir = path.resolve(src.dir);
	if (!fs.existsSync(dir)) fail('源目录不存在：' + dir);

	const containers = src.containers || [];
	const names = fs.readdirSync(dir, { withFileTypes: true })
		.filter(e => e.isDirectory() && (PARTITION_RE.test(e.name) || containers.includes(e.name)))
		.map(e => e.name)
		.sort();

	if (names.length === 0) fail('在 ' + dir + ' 下没有找到「数字-名称」形式的分区目录');

	const nodes = names.map(name => {
		if (!containers.includes(name)) {
			return Object.assign(partitionNode(dir, name), { order: parseInt(name, 10) });
		}
		return containerNode(dir, name);
	});

	if (!src.group) {
		Array.prototype.push.apply(tree, nodes);
		return;
	}

	const anchor = tree.filter(node => node.id === src.after)[0];
	if (!anchor) fail('SOURCES 里 after 指向的顶层节点不存在：' + src.after);

	tree.push({
		id: src.group,
		title: src.group,
		order: anchor.order + 0.25,   // 紧跟在锚点后面，两边编号各自从 00 起也不冲突
		children: nodes
	});
}

// 复制图片资源：正文里统一以 ../_assets/xxx 引用，这里原样搬过来。
// 多个源的图片合并进同一个 wiki/_assets/，重名会在 copyFile 里报错。
function copyAssets() {
	let n = 0;
	for (const src of SOURCES) {
		const dir = path.join(path.resolve(src.dir), '_assets');
		if (!fs.existsSync(dir)) continue;
		for (const f of fs.readdirSync(dir)) {
			copyFile(path.join(dir, f), path.join(WIKI_DIR, '_assets', f));
			n++;
		}
	}
	return n;
}

function main() {
	// 每次重新生成，避免源里删掉的笔记在 wiki/ 里残留
	fs.rmSync(WIKI_DIR, { recursive: true, force: true });
	ensureDir(WIKI_DIR);

	const tree = [];
	for (const src of SOURCES) buildSource(src, tree);

	tree.sort((a, b) => a.order - b.order);
	for (const node of tree) delete node.order;

	const noteCount = countNotes(tree);
	const assetCount = copyAssets();

	writeManifest(tree);

	console.log('源目录   ：' + SOURCES.map(s => path.resolve(s.dir)).join(' / '));
	console.log('顶层     ：' + tree.map(n => n.title).join(' / '));
	console.log('笔记数   ：' + noteCount);
	console.log('图片数   ：' + assetCount);
	console.log('已写出   ：wiki/ 与 assets/js/wiki-data.js');
}

// 递归复制笔记文件到 wiki/。
// node.path 已经是相对源目录（也相对 wiki/）的路径，源与目标同一相对路径。
function collectAndCopy(srcDir, node) {
	if (node.children) {
		for (const child of node.children) {
			collectAndCopy(srcDir, child);
		}
		return;
	}
	copyFile(path.join(srcDir, node.path), path.join(WIKI_DIR, node.path));
}

function countNotes(nodes) {
	let n = 0;
	for (const node of nodes) {
		n += node.children ? countNotes(node.children) : 1;
	}
	return n;
}

function writeManifest(tree) {
	const json = JSON.stringify(tree, null, '\t');
	const out =
		'/*\n' +
		'\twiki-data.js — 由 tools/import-wiki.js 自动生成，请勿手改。\n' +
		'\t要更新内容：改源笔记后重跑 node tools/import-wiki.js\n' +
		'\n' +
		'\t节点结构：\n' +
		'\t  分区/子分区：{ id, title, children: [...] }\n' +
		'\t  笔记：        { id, title, path, order, tags, source }\n' +
		'\t    path 是相对 wiki/ 的路径，浏览器端按此 fetch 对应的 .md\n' +
		'*/\n\n' +
		'window.WIKI = ' + json + ';\n';

	ensureDir(path.dirname(OUT_JS));
	fs.writeFileSync(OUT_JS, out, 'utf8');
}

main();
