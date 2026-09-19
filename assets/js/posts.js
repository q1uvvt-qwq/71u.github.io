/*
	posts.js — 博客文章数据。这是日常写作时唯一需要改动的文件。

	新增一篇文章：
	  1. 在 posts/ 下新建 <slug>.html，写入正文片段（用 <h3> 起小标题，
	     不要用 <h2>，因为 <h2> 已被文章标题占用）。
	  2. 在下面的数组里加一条记录。slug 必须与文件名一致（不含 .html），
	     且建议只用英文小写字母、数字和连字符（如 my-first-post），
	     因为 slug 会同时用于文件名、元素 id 与 URL 锚点。

	字段说明：
	  slug    文章标识，必须与 posts/<slug>.html 文件名一致。
	  title   标题。
	  date    日期，格式 YYYY-MM-DD。列表按此字段倒序排列。
	  tags    标签数组，可留空数组。
	  summary 一句话摘要，显示在目录里；留空则不显示。
*/

window.POSTS = [
	{
		slug: 'hello-notes',
		title: '开篇：为什么我要写笔记',
		date: '2026-09-19',
		tags: ['随笔'],
		summary: '记录项目、技术与思考的全过程。笔记不止于结果，更注重还原想法落地的轨迹。'
	},
	{
		slug: 'engineering-mindset',
		title: '工程化思维：从结果到轨迹',
		date: '2026-09-12',
		tags: ['工程化', '方法论'],
		summary: '为什么我更看重底层机制、系统可靠性与代码可维护性，而不是把能跑通当作终点。'
	}
];
