#!/usr/bin/env node
/*
	import-wiki.js — 把源目录里的笔记同步进博客的「知识库」板块。

	零依赖（只用 Node 内置模块），可重复运行。站点本身不需要构建，
	这个脚本只在「源笔记有更新、需要重新同步」时手动跑一次。

	用法：
		node tools/import-wiki.js

	做四件事：
	  1. 复制各分区的 .md 到 wiki/<分区>/…（保留目录结构，原样复制，含 front-matter）
	  2. 复制 _assets/ 到 wiki/_assets/
	  3. 生成 assets/js/wiki-data.js —— 树清单，供浏览器端 wiki.js 渲染
	  4. 生成 assets/js/wiki-updated.js —— 网页上「最近更新时间」那一行（见 writeUpdated）

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

	  D:/日志检测  主机日志异常检测笔记，3 个分区 20 篇，收进合成容器「模型构建」，
	            紧跟在「蜜罐研究」后面。

  D:/实训笔记/06-信息收集
            另一套笔记（实训系列）里正好也是「信息收集」题材的 5 篇。它不新开分区，
            而是**合并进 D:/ctf 建出来的 01-信息收集**（见 SOURCES 的 mergeInto）：
            笔记挂到那个分区下，与该分区原有的 4 篇按 order 一起排序。源目录不动。

  D:/区块链安全  区块链安全笔记，按题材分成若干子目录（基础认识、网络、共识、最终性 …），
            收进合成容器「区块链安全」。这些子目录没有数字前缀，所以用 allDirs：
            凡是**有 .md 的子目录**都当分区，空目录不进树——以后往这里新建题材目录、
            丢几篇笔记进去，重跑脚本就自动上站，不用再改本文件；分区顺序按目录名
            拼音（想固定成别的顺序，给目录名加个 00- 前缀即可，显示时会去掉）。
            笔记**完全没有 front-matter**，因此用 byTime 按文件时间（= 写作顺序）排。
            源目录一个字节都不动。

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
const OUT_UPDATED = path.join(ROOT, 'assets/js/wiki-updated.js');

// 本次导入实际复制进站点的文件里最新的源文件修改时间。网页上「最近更新时间」显示的就是它。
let latestMs = 0;

const PARTITION_RE = /^\d{2}-/;

/*
	内容源，数组顺序即它们贡献的顶层节点在树里的先后。

	  dir         源目录，只读，不入库
	  containers  该源里当「容器」用的目录名：目录真实存在，但它自己不是分区，
	              只是若干分区的归类
	  group       把该源扫出来的分区整体再收进一个合成容器（源目录里没有这层）
	  after       合成容器排在哪个顶层节点之后；锚点必须来自先处理的源
  mergeInto   不开新分区，把该源的笔记并进这个已存在的分区（分区 id）；
              该分区必须由排在前面的源建出来
  allDirs     凡是有 .md 的子目录（含子目录）都当分区，空目录不进树；供目录名没有
              「数字-名称」前缀的源使用（写了它就不再按 PARTITION_RE 自动识别）
  byTime      笔记缺 front-matter order 时按**文件时间**排，而不是退回文件名——
              给「按写作先后顺序读」的笔记用

	几个源的编号都从 00 起，所以合成容器不能按编号自动落位，得逐个给 after 串起来
	（web知识 → 工控安全 → 蜜罐研究 → 模型构建）。
*/
const SOURCES = [
	{ dir: 'D:/ctf', containers: ['web知识'] },
	{ dir: 'D:/工控', group: '工控安全', after: 'web知识' },
	{ dir: 'D:/蜜罐', group: '蜜罐研究', after: '工控安全' },
	{ dir: 'D:/日志检测', group: '模型构建', after: '蜜罐研究' },
	// 区块链安全：分区目录没有数字前缀，用 allDirs 把「有笔记的子目录」全收进来
	// （空目录不进树）；笔记没有 front-matter，靠 byTime 按文件时间排（也就是写作顺序）
	{ dir: 'D:/区块链安全', group: '区块链安全', after: '模型构建',
	  allDirs: true, byTime: true },
	// 实训系列里与已有分区同题材的，并进去而不是另开一个「信息收集」
	{ dir: 'D:/实训笔记/06-信息收集', mergeInto: '01-信息收集' }
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
	// 「最近更新时间」只认真正上了站的文件：笔记、图片、mergeInto 来的都一样走这里，
	// 而源目录里那些不导入的目录（D:/ctf/RCE、base 等）自然不计入。
	latestMs = Math.max(latestMs, fs.statSync(from).mtimeMs);
	fs.copyFileSync(from, to);
}

/* ---------- 扫描 ---------- */

// 笔记的排序时间：取创建时间与修改时间中较早的那个。
//   用创建时间是因为改一下笔记内容不该让它换位置（mtime 会变）；
//   但要取 min——目录被**复制/搬动**过时，mtime 保留、创建时间却被刷成搬动那一刻，
//   光看 birthtime 会让老笔记凭空排到新笔记后面。两者取小对「编辑过」和「搬动过」都稳：
//   新写的笔记 birth ≈ mtime，编辑过的靠 birth，搬动过的靠 mtime。
// 个别文件系统不给创建时间（返回 0），那就只剩 mtime。
function timeOf(stat) {
	const birth = stat.birthtimeMs > 0 ? stat.birthtimeMs : stat.mtimeMs;
	return Math.min(birth, stat.mtimeMs);
}

// 这个目录（含子目录）里有没有 .md？给 allDirs 用：空目录不进树，
// 免得给还没动笔的题材在站上留一堆空占位。
function hasNotes(absDir) {
	const entries = fs.readdirSync(absDir, { withFileTypes: true });
	if (entries.some(e => !e.isDirectory() && /\.md$/i.test(e.name))) return true;
	return entries.filter(e => e.isDirectory())
		.some(e => hasNotes(path.join(absDir, e.name)));
}

// 递归扫描一个目录：
//   直接属于它的 .md → notes（按 front-matter order 升序；order 缺失时，byTime 的源按文件
//                      时间排、其余按文件名）
//   子目录 → groups（按目录名升序），递归下去；groups 排在 notes 之后
// 这样与 README 里的编号顺序一致（如 01-信息收集 的 1-4 是正文，5-6 在 爆破/ 子目录）。
function scanDir(absDir, relDir, byTime) {
	const entries = fs.readdirSync(absDir, { withFileTypes: true });
	const notes = [];
	const groups = [];
	// 文件时间只用于本次排序，存在这里而不是节点上，免得混进 wiki-data.js
	const times = new Map();

	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'zh'))) {
		const abs = path.join(absDir, entry.name);

		if (entry.isDirectory()) {
			groups.push({
				id: toPosix(relDir ? path.join(relDir, entry.name) : entry.name),
				title: entry.name,
				children: scanDir(abs, relDir ? path.join(relDir, entry.name) : entry.name, byTime)
			});
		} else if (entry.name.toLowerCase().endsWith('.md')) {
			const relFile = relDir ? path.join(relDir, entry.name) : entry.name;
			const fm = parseFrontMatter(fs.readFileSync(abs, 'utf8'));
			const base = entry.name.replace(/\.md$/i, '');
			const relPosix = toPosix(relFile);

			notes.push({
				id: relPosix.replace(/\.md$/i, ''),
				title: fm.title || base,
				path: relPosix,
				order: typeof fm.order === 'number' ? fm.order : null,
				tags: Array.isArray(fm.tags) ? fm.tags : [],
				source: fm.source || ''
			});
			times.set(relPosix, timeOf(fs.statSync(abs)));
		}
	}

	notes.sort((a, b) => {
		const ao = a.order === null ? Number.MAX_SAFE_INTEGER : a.order;
		const bo = b.order === null ? Number.MAX_SAFE_INTEGER : b.order;
		if (ao !== bo) return ao - bo;
		if (byTime) {
			const d = times.get(a.path) - times.get(b.path);
			if (d) return d;
		}
		return a.title.localeCompare(b.title, 'zh');
	});

	return notes.concat(groups);
}

/* ---------- 主流程 ---------- */

// 生成一个分区节点。id / 文件路径都用真实相对路径（含数字前缀，与源目录逐字对应），
// 只有 title 去掉「数字-」前缀——编号在源目录里还承担排序作用，但没必要显示给人看。
function partitionNode(srcDir, relDir, byTime) {
	const children = scanDir(path.join(srcDir, relDir.split('/').join(path.sep)), relDir, byTime);
	for (const node of children) {
		collectAndCopy(srcDir, node);
	}
	const id = toPosix(relDir);
	return { id, title: id.split('/').pop().replace(PARTITION_RE, ''), children };
}

// 容器目录：id、显示名都用目录名本身，同名分区不重复前缀。
function containerNode(srcDir, name, byTime) {
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
		children: members.map(member => partitionNode(srcDir, name + '/' + member, byTime))
	};
}

// 扫一个源，把它的顶层节点推进 tree。
// 带 group 的源多包一层容器；容器要排在 after 指的节点之后，所以锚点必须已经在 tree 里
// （即来自先处理的源）。
function buildSource(src, tree) {
	const dir = path.resolve(src.dir);
	if (!fs.existsSync(dir)) fail('源目录不存在：' + dir);

	// 合并型源：不新建顶层节点，只把笔记挂到已有分区下
	if (src.mergeInto) return mergeIntoTarget(src, dir, tree, src.byTime);

	const containers = src.containers || [];
	const byTime = !!src.byTime;

	let names;
	if (src.allDirs) {
		// 自动识别：目录名没有「数字-名称」前缀时用它。只要子目录里有 .md 就是个分区，
		// 空目录不进树——以后往源目录新建题材目录、丢几篇笔记进去，重跑即可，不用改这里。
		names = fs.readdirSync(dir, { withFileTypes: true })
			.filter(e => e.isDirectory() && hasNotes(path.join(dir, e.name)))
			.map(e => e.name)
			.sort((a, b) => a.localeCompare(b, 'zh'));
	} else {
		names = fs.readdirSync(dir, { withFileTypes: true })
			.filter(e => e.isDirectory() && (PARTITION_RE.test(e.name) || containers.includes(e.name)))
			.map(e => e.name)
			.sort();
	}

	if (names.length === 0) {
		fail('在 ' + dir + ' 下没有找到分区目录' +
			(src.allDirs ? '（allDirs：没有任何子目录装着 .md）' : '（形如「01-名称」）'));
	}

	const nodes = names.map((name, i) => {
		if (containers.includes(name)) return containerNode(dir, name, byTime);
		const num = parseInt(name, 10);
		// 没有数字前缀时用下标垫底，别让 NaN 流进清单（JSON 里会变成 null）
		return Object.assign(partitionNode(dir, name, byTime), { order: isNaN(num) ? i : num });
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

/* ---------- 合并进已有分区 ---------- */

// 排序键：笔记看 front-matter 的 order，分组和没写 order 的笔记都排最后
function nodeOrder(node) {
	return node.children || typeof node.order !== 'number' ? Number.MAX_SAFE_INTEGER : node.order;
}

// 把子树里的 id / path 统一加上分区前缀。title 不动（笔记名照旧、分组名顺手去掉数字前缀），
// 只改定位用的字段——所以必须**先复制、后 reparent**，否则路径就对不上源文件了。
function reparent(node, prefix) {
	node.id = prefix + '/' + node.id;
	if (node.path) node.path = prefix + '/' + node.path;
	if (!node.children) return;
	node.title = node.title.replace(PARTITION_RE, '');
	for (const child of node.children) reparent(child, prefix);
}

// 把 src.dir 的笔记并进 tree 里 id === mergeInto 的那个分区，不新建顶层节点。
// 目标分区必须已经由排在前面的源建出来——合并后两边的 order 会混在一起，所以再排一次。
function mergeIntoTarget(src, dir, tree, byTime) {
	const target = tree.filter(node => node.id === src.mergeInto)[0];
	if (!target) fail('mergeInto 指向的分区不存在：' + src.mergeInto + '（得由排在前面的源建出来）');
	if (!target.children) fail('mergeInto 指向的节点不是分区：' + src.mergeInto);

	const scanned = scanDir(dir, '', byTime);
	for (const node of scanned) collectAndCopy(dir, node, src.mergeInto);
	for (const node of scanned) reparent(node, src.mergeInto);

	Array.prototype.push.apply(target.children, scanned);
	target.children.sort((a, b) => nodeOrder(a) - nodeOrder(b) || a.title.localeCompare(b.title, 'zh'));
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
	writeUpdated();

	console.log('源目录   ：' + SOURCES.map(s =>
		path.resolve(s.dir) + (s.mergeInto ? ' → ' + s.mergeInto : '')).join(' / '));
	console.log('顶层     ：' + tree.map(n => n.title).join(' / '));
	console.log('笔记数   ：' + noteCount);
	console.log('图片数   ：' + assetCount);
	console.log('最近更新 ：' + stamp(latestMs));
	console.log('已写出   ：wiki/ 、assets/js/wiki-data.js 与 assets/js/wiki-updated.js');
}

// 递归复制笔记文件到 wiki/。
// node.path 是相对源目录的路径；目标若不加 destPrefix 就与源同一相对路径
// （分区自己的目录已经等于它的 id），合并进别的分区时才需要额外前缀。
function collectAndCopy(srcDir, node, destPrefix) {
	if (node.children) {
		for (const child of node.children) {
			collectAndCopy(srcDir, child, destPrefix);
		}
		return;
	}
	const dest = destPrefix ? destPrefix + '/' + node.path : node.path;
	copyFile(path.join(srcDir, node.path), path.join(WIKI_DIR, dest));
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

// 本地时间 YYYY-MM-DD HH:mm。刻意不用 toISOString()——那是 UTC，会把 14:11 写成 06:11，
// 东八区晚上跑还可能整体错到前一天。
function stamp(ms) {
	const pad = n => String(n).padStart(2, '0');
	const d = new Date(ms);
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
		' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// 网页上「最近更新时间」那一行。单独成文件，不动 wiki-data.js（树变了才要重写它，
// 而这个日期只要有一篇笔记改过就该变，两者不必绑在一起）。
function writeUpdated() {
	const out =
		'/*\n' +
		'\twiki-updated.js — 「知识库」里显示的最近更新时间。由 tools/import-wiki.js 自动生成，请勿手改。\n' +
		'\n' +
		'\t取值 = 本次导入复制进 wiki/ 的所有笔记与图片里最新的**源文件修改时间**（mtime），\n' +
		'\t也就是「你最后动过哪篇笔记」的时刻。只重跑脚本、没改笔记时这个值不变。\n' +
		'\n' +
		'\t要更新它：改源笔记后重跑 node tools/import-wiki.js\n' +
		'*/\n' +
		'window.WIKI_UPDATED = ' + JSON.stringify(stamp(latestMs)) + ';\n';

	ensureDir(path.dirname(OUT_UPDATED));
	fs.writeFileSync(OUT_UPDATED, out, 'utf8');
}

main();
