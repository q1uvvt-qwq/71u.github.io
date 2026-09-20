/*
	wiki.js — 「知识库」板块：左侧知识树，右侧读该篇笔记。

	数据来源：
	  assets/js/wiki-data.js  树清单（由 tools/import-wiki.js 从源笔记生成）
	  wiki/<路径>.md          笔记正文，仍是源笔记原样（含 front-matter）

	正文只在第一次点击某篇时才 fetch，用 marked 在浏览器端渲染，所以
	index.html 与本文件的体积都不随笔记数量增长。

	与 blog.js 的区别：知识库是 index.html 里的静态 <article id="wiki">，
	没有「动态建壳必须先于 main.js」的时序约束；单篇笔记也不做深链
	（点笔记不改变 location.hash，只切换右侧内容）。
*/
(function () {
	'use strict';

	var TREE = Array.isArray(window.WIKI) ? window.WIKI : [];
	var OPEN_KEY = 'wiki-open';

	// 笔记正文里图片统一写成 ../_assets/xxx。它相对「源文件所在目录」是对的，
	// 但经 innerHTML 注入后，相对路径是按**当前页面 URL** 解析的，会落到站点
	// 根目录之外而断链，所以要改写成相对站点根的正确路径。
	var ASSET_FROM = '../_assets/';
	var ASSET_TO = 'wiki/_assets/';

	var treeEl = document.querySelector('#wiki .wiki-tree');
	var bodyEl = document.querySelector('#wiki .wiki-body');
	if (!treeEl || !bodyEl) return;

	var currentId = null;   // 当前选中笔记的 id
	var loaded = {};        // id -> 原始 Markdown，已成功载入过的正文

	/* ---------- 展开状态（localStorage） ---------- */

	// 存的是所有处于展开状态的节点 id。localStorage 在 file:// 或隐私模式下
	// 可能直接抛错，所以读写都包一层；失败就退化成「不记忆」。
	function readOpen() {
		try {
			var raw = JSON.parse(window.localStorage.getItem(OPEN_KEY));
			return Array.isArray(raw) ? raw : [];
		} catch (error) {
			return [];
		}
	}

	function rememberOpen() {
		var ids = [];
		Array.prototype.forEach.call(treeEl.querySelectorAll('details[open]'), function (details) {
			ids.push(details.dataset.id);
		});
		try {
			window.localStorage.setItem(OPEN_KEY, JSON.stringify(ids));
		} catch (error) {
			/* 记不住就算了，不影响阅读 */
		}
	}

	/* ---------- 知识树 ---------- */

	function buildBranch(nodes, openIds) {
		var fragment = document.createDocumentFragment();
		nodes.forEach(function (node) {
			fragment.appendChild(node.children ? buildGroup(node, openIds) : buildNote(node));
		});
		return fragment;
	}

	// 分区/子分区用原生 <details>：展开收起零 JS、可键盘操作。
	function buildGroup(node, openIds) {
		var details = document.createElement('details');
		details.className = 'wiki-group';
		details.dataset.id = node.id;
		if (openIds.indexOf(node.id) !== -1) details.open = true;

		var summary = document.createElement('summary');
		summary.textContent = node.title;
		details.appendChild(summary);

		var box = document.createElement('div');
		box.className = 'wiki-children';
		if (node.children.length === 0) {
			// 源里确实有空分区（11-逻辑漏洞），保留节点但说明清楚，
			// 免得点开是一片空白让人以为是加载失败。
			var empty = document.createElement('p');
			empty.className = 'wiki-empty';
			empty.textContent = '暂无笔记';
			box.appendChild(empty);
		} else {
			box.appendChild(buildBranch(node.children, openIds));
		}
		details.appendChild(box);

		details.addEventListener('toggle', rememberOpen);
		return details;
	}

	function buildNote(node) {
		var link = document.createElement('a');
		link.className = 'wiki-note';
		link.href = '#wiki';
		link.dataset.id = node.id;
		link.textContent = node.title;
		link.addEventListener('click', function (event) {
			// 知识库页本身已经由 #wiki 打开，这里不必再动哈希——动反而会
			// 让 main.js 的哈希路由重放一次展开动画。
			event.preventDefault();
			select(node, link);
		});
		return link;
	}

	function select(node, link) {
		if (currentId === node.id) return;
		currentId = node.id;

		Array.prototype.forEach.call(treeEl.querySelectorAll('.wiki-note.is-current'), function (el) {
			el.classList.remove('is-current');
		});
		if (link) link.classList.add('is-current');

		renderNote(node);
	}

	/* ---------- 正文 ---------- */

	// 每一段路径分开编码：整体 encodeURIComponent 会把分隔符 / 也编掉。
	function noteUrl(notePath) {
		return 'wiki/' + notePath.split('/').map(encodeURIComponent).join('/');
	}

	function renderNote(node) {
		if (!window.marked || typeof window.marked.parse !== 'function') {
			showLoadError('Markdown 渲染器未载入');
			return;
		}

		if (loaded[node.id]) {
			showNote(node, loaded[node.id]);
			return;
		}

		showMessage('载入中…');
		fetch(noteUrl(node.path))
			.then(function (response) {
				if (!response.ok) throw new Error('HTTP ' + response.status);
				return response.text();
			})
			.then(function (markdown) {
				loaded[node.id] = markdown;
				// 慢请求回来时用户可能已经点了别的笔记。
				if (currentId === node.id) showNote(node, markdown);
			})
			.catch(function (error) {
				if (currentId === node.id) showLoadError(error.message);
			});
	}

	function showNote(node, markdown) {
		bodyEl.textContent = '';

		// article 已有 h2.major「知识库」，所以笔记标题用 h3。
		var title = document.createElement('h3');
		title.className = 'wiki-note-title';
		title.textContent = node.title;
		bodyEl.appendChild(title);

		var meta = buildMeta(node);
		if (meta) bodyEl.appendChild(meta);

		bodyEl.appendChild(renderMarkdown(markdown));
	}

	function buildMeta(node) {
		var parts = (node.tags || []).slice();
		if (node.source) parts.push('来源：' + node.source);
		if (parts.length === 0) return null;

		var p = document.createElement('p');
		p.className = 'wiki-note-meta';
		p.textContent = parts.join(' · ');
		return p;
	}

	function renderMarkdown(markdown) {
		var holder = document.createElement('div');
		holder.className = 'wiki-content';

		// 源笔记原样复制，front-matter 还在，渲染前先摘掉，
		// 否则开头的 --- 会被当成一条水平线、YAML 会变成正文段落。
		var body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

		// wiki/ 与 posts/ 一样是站主自己的内容，属可信来源。
		holder.innerHTML = window.marked.parse(body);

		Array.prototype.forEach.call(holder.querySelectorAll('img'), function (image) {
			var src = image.getAttribute('src') || '';
			if (src.indexOf(ASSET_FROM) === 0) {
				image.setAttribute('src', ASSET_TO + src.slice(ASSET_FROM.length));
			}
		});

		// 复用模板的 .table-wrapper（main.css），窄屏下表格横向滚动而不是撑破版心。
		Array.prototype.forEach.call(holder.querySelectorAll('table'), function (table) {
			var wrapper = document.createElement('div');
			wrapper.className = 'table-wrapper';
			table.parentNode.insertBefore(wrapper, table);
			wrapper.appendChild(table);
		});

		// 标题下沉一级：正文的 ## / ### 顺延为 h4 / h5，
		// 这样「知识库 < 笔记标题 < 章节 < 小节」的层级不会倒挂。
		Array.prototype.forEach.call(holder.querySelectorAll('h1, h2, h3, h4, h5'), function (heading) {
			var shifted = document.createElement('h' + (Number(heading.tagName.charAt(1)) + 1));
			while (heading.firstChild) shifted.appendChild(heading.firstChild);
			heading.parentNode.replaceChild(shifted, heading);
		});

		return holder;
	}

	/* ---------- 提示信息 ---------- */

	function showMessage(text) {
		bodyEl.textContent = '';
		var p = document.createElement('p');
		p.className = 'wiki-placeholder';
		p.textContent = text;
		bodyEl.appendChild(p);
	}

	function showLoadError(message) {
		bodyEl.textContent = '';

		var p = document.createElement('p');
		var strong = document.createElement('strong');
		strong.textContent = '笔记载入失败';
		p.appendChild(strong);
		p.appendChild(document.createTextNode(
			'（' + message + '）。若你是用 file:// 直接打开本页，浏览器会拦截读取本地文件，请改用本地服务预览：'
		));

		var code = document.createElement('code');
		code.textContent = 'python -m http.server';
		p.appendChild(code);

		bodyEl.appendChild(p);
	}

	/* ---------- 启动 ---------- */

	if (TREE.length === 0) {
		showMessage('知识库数据未载入，请确认 assets/js/wiki-data.js 已随页面一同部署。');
		return;
	}

	treeEl.appendChild(buildBranch(TREE, readOpen()));
})();
