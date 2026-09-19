/*
	blog.js — 由 assets/js/posts.js 的数据驱动博客目录与文章模态页。

	加载顺序很重要：本文件必须在 assets/js/main.js 之前引入。main.js 在
	执行瞬间会快照 #main 里的 <article> 列表，所以文章壳必须先存在于 DOM
	中，模板的 hash 路由（如 index.html#post-hello-notes）才能找到并打开。

	正文存放在 posts/<slug>.html，仅在首次打开该文章时才 fetch 载入，
	因此 index.html 的体积不会随文章数量增长。
*/
(function () {
	'use strict';

	var POSTS = Array.isArray(window.POSTS) ? window.POSTS.slice() : [];
	var main = document.getElementById('main');

	// 按日期倒序，posts.js 里不必刻意排序；日期缺失的排在最后。
	POSTS.sort(function (a, b) {
		return String(b.date || '').localeCompare(String(a.date || ''));
	});

	function articleId(slug) {
		return 'post-' + slug;
	}

	function bodyUrl(slug) {
		// 相对路径，部署在仓库子路径下同样正确。
		return 'posts/' + encodeURIComponent(slug) + '.html';
	}

	function metaText(post) {
		return [post.date].concat(post.tags || []).filter(Boolean).join(' · ');
	}

	// 文章壳，结构与模板其它 article 一致，Close 按钮由 main.js 自动注入。
	function buildArticle(post) {
		var article = document.createElement('article');
		article.id = articleId(post.slug);

		var title = document.createElement('h2');
		title.className = 'major';
		title.textContent = post.title;

		var meta = document.createElement('p');
		meta.textContent = metaText(post);

		var body = document.createElement('div');
		body.className = 'post-body';
		body.textContent = '载入中…';

		// 模板自带的 Close 会退回落地页，这里补一个回到目录的入口。
		var actions = document.createElement('ul');
		actions.className = 'actions';
		var actionItem = document.createElement('li');
		var back = document.createElement('a');
		back.href = '#blog';
		back.className = 'button small';
		back.textContent = '← 返回目录';
		actionItem.appendChild(back);
		actions.appendChild(actionItem);

		article.appendChild(title);
		article.appendChild(meta);
		article.appendChild(body);
		article.appendChild(actions);
		return article;
	}

	function renderDirectory() {
		var list = document.getElementById('post-list');
		if (!list) return;

		if (POSTS.length === 0) {
			var empty = document.createElement('li');
			empty.textContent = '还没有文章，敬请期待。';
			list.appendChild(empty);
			return;
		}

		POSTS.forEach(function (post) {
			var item = document.createElement('li');

			var title = document.createElement('h3');
			var link = document.createElement('a');
			link.href = '#' + articleId(post.slug);
			link.textContent = post.title;
			title.appendChild(link);

			var meta = document.createElement('p');
			meta.textContent = metaText(post);

			item.appendChild(title);
			item.appendChild(meta);

			if (post.summary) {
				var summary = document.createElement('p');
				summary.textContent = post.summary;
				item.appendChild(summary);
			}

			list.appendChild(item);
		});
	}

	function showLoadError(container, message) {
		var p = document.createElement('p');
		var strong = document.createElement('strong');
		strong.textContent = '正文载入失败';
		p.appendChild(strong);
		p.appendChild(document.createTextNode(
			'（' + message + '）。若你是用 file:// 直接打开本页，浏览器会拦截读取本地文件，请改用本地服务预览：'
		));

		var code = document.createElement('code');
		code.textContent = 'python -m http.server';
		p.appendChild(code);

		container.textContent = '';
		container.appendChild(p);
	}

	function loadBody(id) {
		var article = document.getElementById(id);
		if (!article || article.dataset.state) return; // 已载入或正在载入

		var container = article.querySelector('.post-body');
		if (!container) return;

		article.dataset.state = 'loading';

		fetch(bodyUrl(id.slice('post-'.length)))
			.then(function (response) {
				if (!response.ok) throw new Error('HTTP ' + response.status);
				return response.text();
			})
			.then(function (html) {
				// posts/*.html 是站主自己的内容，与 index.html 同级的可信来源。
				container.innerHTML = html;
				article.dataset.state = 'loaded';
			})
			.catch(function (error) {
				delete article.dataset.state; // 允许重试
				showLoadError(container, error.message);
			});
	}

	function loadFromHash() {
		var id = location.hash.slice(1);
		if (id.indexOf('post-') === 0) loadBody(id);
	}

	// 先渲染目录、再生成文章壳，二者都是同步的，保证 main.js 执行时壳已就位。
	renderDirectory();
	POSTS.forEach(function (post) {
		main.appendChild(buildArticle(post));
	});

	window.addEventListener('hashchange', loadFromHash);
	window.addEventListener('load', loadFromHash);
	loadFromHash(); // 支持直接打开 #post-xxx 这样的深链
})();
