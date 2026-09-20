#!/usr/bin/env node
/*
	import-wiki.js — 把 D:\ctf 的 Web 安全笔记同步进博客的「知识库」板块。

	零依赖（只用 Node 内置模块），可重复运行。站点本身不需要构建，
	这个脚本只在「源笔记有更新、需要重新同步」时手动跑一次。

	用法：
		node tools/import-wiki.js [源目录]      默认 D:/ctf

	做三件事：
	  1. 复制各分区的 .md 到 wiki/<分区>/…（保留目录结构，原样复制，含 front-matter）
	  2. 复制 _assets/ 到 wiki/_assets/
	  3. 生成 assets/js/wiki-data.js —— 树清单，供浏览器端 wiki.js 渲染

	只导入「两位数字 + 连字符」开头的分区目录（00-基础 … 14-工具与环境）；
	源目录里 RCE/ sql/ base/ 等未整理的原始笔记目录会被自动排除。

	注意：每次运行都会先整个删除并重建 wiki/，所以**不要往 wiki/ 里手写内容**，
	那个目录是源笔记的投影。要加笔记，请加到源目录后重跑本脚本。
*/

'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(process.argv[2] || 'D:/ctf');
const ROOT = path.resolve(__dirname, '..');
const WIKI_DIR = path.join(ROOT, 'wiki');
const OUT_JS = path.join(ROOT, 'assets/js/wiki-data.js');

const PARTITION_RE = /^\d{2}-/;

// Windows 路径转成网页用的正斜杠路径
const toPosix = p => p.split(path.sep).join('/');

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

function copyFile(from, to) {
	ensureDir(path.dirname(to));
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

function main() {
	if (!fs.existsSync(SRC)) {
		console.error('源目录不存在：' + SRC);
		process.exit(1);
	}

	// 每次重新生成，避免源里删掉的笔记在 wiki/ 里残留
	fs.rmSync(WIKI_DIR, { recursive: true, force: true });
	ensureDir(WIKI_DIR);

	const partitions = fs.readdirSync(SRC, { withFileTypes: true })
		.filter(e => e.isDirectory() && PARTITION_RE.test(e.name))
		.map(e => e.name)
		.sort();

	if (partitions.length === 0) {
		console.error('在 ' + SRC + ' 下没有找到「数字-名称」形式的分区目录');
		process.exit(1);
	}

	const tree = [];

	for (const name of partitions) {
		const children = scanDir(path.join(SRC, name), name);

		for (const node of children) {
			collectAndCopy(node);
		}

		tree.push({ id: name, title: name, children });
	}
	const noteCount = countNotes(tree);

	// 复制图片资源：正文里统一以 ../_assets/xxx 引用，这里原样搬过来
	const assetSrc = path.join(SRC, '_assets');
	let assetCount = 0;
	if (fs.existsSync(assetSrc)) {
		for (const f of fs.readdirSync(assetSrc)) {
			copyFile(path.join(assetSrc, f), path.join(WIKI_DIR, '_assets', f));
			assetCount++;
		}
	}

	writeManifest(tree);

	console.log('源目录   ：' + SRC);
	console.log('分区数   ：' + partitions.length + '（' + partitions.join(' / ') + '）');
	console.log('笔记数   ：' + noteCount);
	console.log('图片数   ：' + assetCount);
	console.log('已写出   ：wiki/ 与 assets/js/wiki-data.js');
}

// 递归复制笔记文件到 wiki/。
// node.path 已经是相对源目录（也相对 wiki/）的路径，源与目标同一相对路径。
function collectAndCopy(node) {
	if (node.children) {
		for (const child of node.children) {
			collectAndCopy(child);
		}
		return;
	}
	copyFile(path.join(SRC, node.path), path.join(WIKI_DIR, node.path));
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
