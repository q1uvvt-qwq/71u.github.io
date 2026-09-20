/*
	wiki-data.js — 由 tools/import-wiki.js 自动生成，请勿手改。
	要更新内容：改源笔记后重跑 node tools/import-wiki.js

	节点结构：
	  分区/子分区：{ id, title, children: [...] }
	  笔记：        { id, title, path, order, tags, source }
	    path 是相对 wiki/ 的路径，浏览器端按此 fetch 对应的 .md
*/

window.WIKI = [
	{
		"id": "00-基础",
		"title": "基础",
		"children": [
			{
				"id": "00-基础/HTTP-请求头与ABNF语法",
				"title": "HTTP 请求头与 ABNF 语法",
				"path": "00-基础/HTTP-请求头与ABNF语法.md",
				"order": 1,
				"tags": [
					"HTTP",
					"ABNF",
					"请求行",
					"状态行",
					"百分号编码",
					"请求头",
					"响应头",
					"User-Agent",
					"Referer"
				],
				"source": ""
			},
			{
				"id": "00-基础/HTTP-GET与POST",
				"title": "HTTP GET 与 POST",
				"path": "00-基础/HTTP-GET与POST.md",
				"order": 2,
				"tags": [
					"HTTP",
					"GET",
					"POST",
					"请求体",
					"Content-Type",
					"参数传递"
				],
				"source": ""
			},
			{
				"id": "00-基础/PHP文件读写函数对比",
				"title": "PHP 文件读写函数对比：file_get_contents 与 file_put_contents",
				"path": "00-基础/PHP文件读写函数对比.md",
				"order": 3,
				"tags": [
					"PHP",
					"file_get_contents",
					"file_put_contents",
					"php://filter",
					"文件读取",
					"文件写入",
					"死亡exit"
				],
				"source": ""
			},
			{
				"id": "00-基础/网络-IP、HTTP与HTTPS",
				"title": "IP、HTTP 与 HTTPS",
				"path": "00-基础/网络-IP、HTTP与HTTPS.md",
				"order": 4,
				"tags": [
					"IP",
					"DHCP",
					"URI",
					"URL",
					"HTTP",
					"HTTPS",
					"状态码",
					"请求方法",
					"无状态"
				],
				"source": ""
			},
			{
				"id": "00-基础/网络-协议与客户端DNS",
				"title": "网络协议分层与客户端 DNS",
				"path": "00-基础/网络-协议与客户端DNS.md",
				"order": 5,
				"tags": [
					"OSI",
					"TCP-IP",
					"DNS",
					"域名",
					"URL",
					"路径",
					"路由",
					"ping",
					"nslookup"
				],
				"source": ""
			},
			{
				"id": "00-基础/Web服务器-index.php与默认首页",
				"title": "Web 默认首页：index.php 是什么",
				"path": "00-基础/Web服务器-index.php与默认首页.md",
				"order": 6,
				"tags": [
					"index.php",
					"默认首页",
					"DirectoryIndex",
					"目录扫描",
					"源码泄露"
				],
				"source": ""
			},
			{
				"id": "00-基础/PHP-highlight_file的特殊行为",
				"title": "PHP highlight_file() 的特殊行为",
				"path": "00-基础/PHP-highlight_file的特殊行为.md",
				"order": 7,
				"tags": [
					"PHP",
					"highlight_file",
					"is_file",
					"流包装器",
					"php://filter",
					"源码泄露"
				],
				"source": ""
			},
			{
				"id": "00-基础/编码-为什么要Base64",
				"title": "为什么要 Base64：include 无回显而 php://filter 有回显",
				"path": "00-基础/编码-为什么要Base64.md",
				"order": 8,
				"tags": [
					"PHP",
					"php://filter",
					"base64",
					"include",
					"readfile",
					"文件包含",
					"源码泄露"
				],
				"source": ""
			},
			{
				"id": "00-基础/编码-ROT13与Base64选型",
				"title": "ROT13 与 Base64 的选型：绕过死亡 exit",
				"path": "00-基础/编码-ROT13与Base64选型.md",
				"order": 9,
				"tags": [
					"PHP",
					"php://filter",
					"rot13",
					"base64",
					"死亡exit",
					"file_put_contents"
				],
				"source": ""
			},
			{
				"id": "00-基础/网络-TCP一句话概括",
				"title": "TCP 一句话概括与可靠性机制",
				"path": "00-基础/网络-TCP一句话概括.md",
				"order": 10,
				"tags": [
					"TCP",
					"三次握手",
					"四次挥手",
					"流量控制",
					"拥塞控制",
					"报文段"
				],
				"source": ""
			}
		]
	},
	{
		"id": "01-信息收集",
		"title": "信息收集",
		"children": [
			{
				"id": "01-信息收集/目录扫描-dirsearch",
				"title": "目录扫描：dirsearch",
				"path": "01-信息收集/目录扫描-dirsearch.md",
				"order": 1,
				"tags": [
					"dirsearch",
					"目录扫描",
					"信息收集",
					"备份文件",
					"状态码",
					"字典"
				],
				"source": ""
			},
			{
				"id": "01-信息收集/子域名-OneForAll",
				"title": "子域名收集：OneForAll",
				"path": "01-信息收集/子域名-OneForAll.md",
				"order": 2,
				"tags": [
					"OneForAll",
					"子域名",
					"信息收集",
					"证书透明日志",
					"字典爆破"
				],
				"source": ""
			},
			{
				"id": "01-信息收集/端口服务-nmap",
				"title": "端口与服务扫描：nmap",
				"path": "01-信息收集/端口服务-nmap.md",
				"order": 3,
				"tags": [
					"nmap",
					"端口扫描",
					"服务版本",
					"信息收集",
					"CTF"
				],
				"source": ""
			},
			{
				"id": "01-信息收集/目录遍历",
				"title": "目录遍历（路径遍历）",
				"path": "01-信息收集/目录遍历.md",
				"order": 4,
				"tags": [
					"路径遍历",
					"目录遍历",
					"../",
					"URL编码",
					"空字节截断",
					"readfile",
					"黑盒推断"
				],
				"source": ""
			}
		]
	},
	{
		"id": "web知识",
		"title": "web知识",
		"children": [
			{
				"id": "web知识/02-SQL注入",
				"title": "SQL注入",
				"children": [
					{
						"id": "web知识/02-SQL注入/SQL注入底层原理-解析与执行的博弈",
						"title": "SQL注入底层原理：解析与执行的博弈",
						"path": "web知识/02-SQL注入/SQL注入底层原理-解析与执行的博弈.md",
						"order": 0,
						"tags": [
							"SQL注入",
							"解析器",
							"词法分析",
							"语法分析",
							"动态SQL",
							"预处理",
							"提前闭合",
							"DNSLOG"
						],
						"source": "luvvvv 学习笔记《2. SQL 注入的底层原理：解析与执行的博弈》"
					},
					{
						"id": "web知识/02-SQL注入/SQL基础语法",
						"title": "SQL 基础语法",
						"path": "web知识/02-SQL注入/SQL基础语法.md",
						"order": 1,
						"tags": [
							"SQL",
							"关系型数据库",
							"CRUD",
							"SELECT",
							"WHERE",
							"增删改查"
						],
						"source": "luvvvv 学习笔记《SQL》"
					},
					{
						"id": "web知识/02-SQL注入/SQL注入概览",
						"title": "SQL 注入概览：拿到注入能力后去哪找 flag",
						"path": "web知识/02-SQL注入/SQL注入概览.md",
						"order": 2,
						"tags": [
							"SQL注入",
							"information_schema",
							"load_file",
							"INTO OUTFILE",
							"sqlite_master",
							"信息收集",
							"flag路径"
						],
						"source": "luvvvv 学习笔记《SQLI》"
					},
					{
						"id": "web知识/02-SQL注入/MySQL基础",
						"title": "MySQL 基础：SQL 与 MySQL 的区别",
						"path": "web知识/02-SQL注入/MySQL基础.md",
						"order": 3,
						"tags": [
							"MySQL",
							"SQL",
							"关系型数据库",
							"DBMS",
							"数据库指纹"
						],
						"source": "luvvvv 学习笔记《MYSQL》"
					},
					{
						"id": "web知识/02-SQL注入/MySQL核心原理",
						"title": "MySQL 核心原理：从架构到\"谁在当 SQL 客户端",
						"path": "web知识/02-SQL注入/MySQL核心原理.md",
						"order": 4,
						"tags": [
							"MySQL",
							"连接器",
							"连接池",
							"解析器",
							"词法分析",
							"预处理器",
							"prepare",
							"WAF"
						],
						"source": "luvvvv 学习笔记《mysql核心原理》"
					},
					{
						"id": "web知识/02-SQL注入/SQL注入核心概念速记",
						"title": "SQL 注入核心概念速记（关键词、eval、取反免杀与字面量）",
						"path": "web知识/02-SQL注入/SQL注入核心概念速记.md",
						"order": 5,
						"tags": [
							"关键字大小写",
							"Content-Type",
							"WHERE布尔表达式",
							"eval",
							"assert",
							"语言构造器",
							"可变函数",
							"取反免杀",
							"字面量",
							"正则"
						],
						"source": "luvvvv/love.md + base/love.md（两篇内容完全相同，此处合并为一篇）"
					},
					{
						"id": "web知识/02-SQL注入/与SQL注入相似的其他漏洞",
						"title": "与 SQL 注入相似的其他漏洞",
						"path": "web知识/02-SQL注入/与SQL注入相似的其他漏洞.md",
						"order": 6,
						"tags": [
							"注入类漏洞",
							"命令注入",
							"XSS",
							"SSTI",
							"LDAP注入",
							"XPath注入",
							"代码注入",
							"反序列化"
						],
						"source": "luvvvv 学习笔记《与sqli相似的其他漏洞》"
					},
					{
						"id": "web知识/02-SQL注入/布尔盲注-原理与利用",
						"title": "布尔盲注原理与利用",
						"path": "web知识/02-SQL注入/布尔盲注-原理与利用.md",
						"order": 10,
						"tags": [
							"ctfshow",
							"web189",
							"load_file",
							"regexp",
							"盲注",
							"MySQL弱类型"
						],
						"source": "ctfshow web189"
					},
					{
						"id": "web知识/02-SQL注入/字符型与数字型注入-闭合原理",
						"title": "字符型与数字型注入-闭合原理",
						"path": "web知识/02-SQL注入/字符型与数字型注入-闭合原理.md",
						"order": 11,
						"tags": [
							"闭合",
							"注释符",
							"字符型",
							"数字型",
							"order by",
							"列数判断"
						],
						"source": "字符型与数字型区分 + 注入&&闭合 + 闭合之后想要注入"
					},
					{
						"id": "web知识/02-SQL注入/联合查询注入完整攻击流程",
						"title": "联合查询注入完整攻击流程",
						"path": "web知识/02-SQL注入/联合查询注入完整攻击流程.md",
						"order": 12,
						"tags": [
							"union",
							"order by",
							"回显点",
							"information_schema",
							"hex",
							"group_concat"
						],
						"source": "字符型注入完整攻击流程 + ctfshow union 题解"
					},
					{
						"id": "web知识/02-SQL注入/信息收集-库表列字段",
						"title": "信息收集-库表列字段",
						"path": "web知识/02-SQL注入/信息收集-库表列字段.md",
						"order": 13,
						"tags": [
							"information_schema",
							"group_concat",
							"union",
							"order by",
							"group by",
							"常用函数"
						],
						"source": "通用的信息收集步骤 + 查询&&函数"
					},
					{
						"id": "web知识/02-SQL注入/子查询",
						"title": "子查询",
						"path": "web知识/02-SQL注入/子查询.md",
						"order": 14,
						"tags": [
							"子查询",
							"括号",
							"标量子查询",
							"union"
						],
						"source": "子查询"
					},
					{
						"id": "web知识/02-SQL注入/过滤绕过-空格与关键字",
						"title": "过滤绕过-空格与关键字",
						"path": "web知识/02-SQL注入/过滤绕过-空格与关键字.md",
						"order": 15,
						"tags": [
							"ctfshow",
							"web176",
							"web177",
							"web178",
							"web179",
							"web180",
							"web181",
							"web182",
							"waf",
							"注释符",
							"空白符"
						],
						"source": "ctfshow web176-181"
					},
					{
						"id": "web知识/02-SQL注入/过滤绕过-数字与引号",
						"title": "过滤绕过-数字与引号",
						"path": "web知识/02-SQL注入/过滤绕过-数字与引号.md",
						"order": 16,
						"tags": [
							"ctfshow",
							"web174",
							"web175",
							"web185",
							"waf",
							"into outfile",
							"replace",
							"concat",
							"chr",
							"十六进制"
						],
						"source": "ctfshow web174/web175/web185"
					},
					{
						"id": "web知识/02-SQL注入/过滤绕过-where与引号-having与join",
						"title": "过滤绕过-where与引号-having与join",
						"path": "web知识/02-SQL注入/过滤绕过-where与引号-having与join.md",
						"order": 17,
						"tags": [
							"ctfshow",
							"web184",
							"having",
							"where",
							"group by",
							"join",
							"十六进制",
							"0x"
						],
						"source": "ctfshow web184"
					},
					{
						"id": "web知识/02-SQL注入/md5与弱比较绕过",
						"title": "md5与弱比较绕过",
						"path": "web知识/02-SQL注入/md5与弱比较绕过.md",
						"order": 18,
						"tags": [
							"ctfshow",
							"web187",
							"web188",
							"md5",
							"二进制",
							"弱比较",
							"隐式类型转换",
							"ffifdyop"
						],
						"source": "ctfshow web187 + web188"
					},
					{
						"id": "web知识/02-SQL注入/输出编码绕过",
						"title": "输出编码绕过",
						"path": "web知识/02-SQL注入/输出编码绕过.md",
						"order": 19,
						"tags": [
							"ctfshow",
							"web172",
							"hex",
							"to_base64",
							"输出过滤",
							"union",
							"回显"
						],
						"source": "ctfshow web172"
					},
					{
						"id": "web知识/02-SQL注入/增删改与堆叠注入",
						"title": "增删改与堆叠注入",
						"path": "web知识/02-SQL注入/增删改与堆叠注入.md",
						"order": 20,
						"tags": [
							"DDL",
							"DML",
							"insert",
							"update",
							"delete",
							"堆叠注入",
							"多语句",
							"mysqli_multi_query"
						],
						"source": "SQL 增删改语法笔记"
					},
					{
						"id": "web知识/02-SQL注入/LIKE注入与盲注脚本",
						"title": "LIKE注入与盲注脚本",
						"path": "web知识/02-SQL注入/LIKE注入与盲注脚本.md",
						"order": 21,
						"tags": [
							"ctfshow",
							"web183",
							"like",
							"regexp",
							"盲注",
							"服务器端爆破",
							"反引号"
						],
						"source": "ctfshow web183"
					},
					{
						"id": "web知识/02-SQL注入/题解-条件优先级与flag回显绕过",
						"title": "题解-条件优先级与flag回显绕过",
						"path": "web知识/02-SQL注入/题解-条件优先级与flag回显绕过.md",
						"order": 22,
						"tags": [
							"ctfshow",
							"web171",
							"web173",
							"or",
							"and",
							"优先级",
							"注释",
							"hex",
							"输出过滤"
						],
						"source": "ctfshow web171 + web173"
					},
					{
						"id": "web知识/02-SQL注入/SQLite布尔盲注题解",
						"title": "SQLite 布尔盲注题解",
						"path": "web知识/02-SQL注入/SQLite布尔盲注题解.md",
						"order": 23,
						"tags": [
							"SQLite",
							"布尔盲注",
							"脚本",
							"/**/注释绕过",
							"--+注释",
							"geek"
						],
						"source": "geek 靶场 week2"
					}
				]
			},
			{
				"id": "web知识/03-命令执行与代码执行",
				"title": "命令执行与代码执行",
				"children": [
					{
						"id": "web知识/03-命令执行与代码执行/PHP命令执行与代码执行函数速查",
						"title": "PHP 命令执行与代码执行函数速查",
						"path": "web知识/03-命令执行与代码执行/PHP命令执行与代码执行函数速查.md",
						"order": 1,
						"tags": [
							"RCE",
							"PHP",
							"system",
							"exec",
							"shell_exec",
							"passthru",
							"eval",
							"assert",
							"一句话木马"
						],
						"source": "课程笔记（PHP 命令执行函数）"
					},
					{
						"id": "web知识/03-命令执行与代码执行/RCE漏洞全解",
						"title": "RCE 漏洞全解——过滤绕过与无回显外带",
						"path": "web知识/03-命令执行与代码执行/RCE漏洞全解.md",
						"order": 2,
						"tags": [
							"RCE",
							"命令执行",
							"过滤绕过",
							"空格绕过",
							"通配符",
							"变量拼接",
							"无回显",
							"dnslog",
							"反弹shell"
						],
						"source": "网络整理（rce 全面总结）"
					},
					{
						"id": "web知识/03-命令执行与代码执行/无数字字母WebShell构造",
						"title": "无数字字母 WebShell 构造",
						"path": "web知识/03-命令执行与代码执行/无数字字母WebShell构造.md",
						"order": 3,
						"tags": [
							"无字母数字",
							"取反",
							"异或",
							"位运算",
							"webshell",
							"eval",
							"URL编码"
						],
						"source": "学习笔记（CSDN 无字母数字 Webshell）"
					},
					{
						"id": "web知识/03-命令执行与代码执行/读文件命令绕过",
						"title": "读文件命令绕过",
						"path": "web知识/03-命令执行与代码执行/读文件命令绕过.md",
						"order": 4,
						"tags": [
							"cat",
							"tac",
							"文件读取",
							"命令替代",
							"通配符",
							"base64",
							"RCE"
						],
						"source": "命令执行笔记（cat 被过滤时的替代命令）"
					}
				]
			},
			{
				"id": "web知识/04-文件上传",
				"title": "文件上传",
				"children": [
					{
						"id": "web知识/04-文件上传/文件上传漏洞概览与前端绕过",
						"title": "文件上传漏洞概览与前端校验绕过",
						"path": "web知识/04-文件上传/文件上传漏洞概览与前端绕过.md",
						"order": 1,
						"tags": [
							"ctfshow",
							"web151",
							"文件上传",
							"前端校验",
							"抓包",
							"一句话木马",
							"目录遍历",
							"相对路径"
						],
						"source": "ctfshow web151"
					},
					{
						"id": "web知识/04-文件上传/MIME类型检测绕过",
						"title": "MIME 类型检测绕过",
						"path": "web知识/04-文件上传/MIME类型检测绕过.md",
						"order": 2,
						"tags": [
							"ctfshow",
							"web152",
							"MIME",
							"Content-Type",
							"抓包改包",
							"一句话木马",
							"防御纵深"
						],
						"source": "ctfshow web152"
					},
					{
						"id": "web知识/04-文件上传/文件名与后缀绕过",
						"title": "文件名与后缀绕过",
						"path": "web知识/04-文件上传/文件名与后缀绕过.md",
						"order": 3,
						"tags": [
							"ctfshow",
							"web153",
							"后缀黑名单",
							"双扩展名",
							"大小写绕过",
							"魔术字节",
							".htaccess",
							"AddType"
						],
						"source": "ctfshow web153"
					},
					{
						"id": "web知识/04-文件上传/.user.ini利用",
						"title": ".user.ini 利用 —— 用配置让图片跑起 PHP",
						"path": "web知识/04-文件上传/.user.ini利用.md",
						"order": 4,
						"tags": [
							"ctfshow",
							"web153",
							".user.ini",
							"auto_prepend_file",
							"auto_append_file",
							"PHP-FPM",
							"蚁剑"
						],
						"source": "ctfshow web153"
					},
					{
						"id": "web知识/04-文件上传/文件内容过滤绕过",
						"title": "文件内容过滤绕过",
						"path": "web知识/04-文件上传/文件内容过滤绕过.md",
						"order": 5,
						"tags": [
							"ctfshow",
							"web154",
							"web155",
							"内容过滤",
							"PHP标签",
							"大小写绕过",
							"Unicode转义"
						],
						"source": "ctfshow web154"
					},
					{
						"id": "web知识/04-文件上传/上传参数与细节",
						"title": "上传参数与流封装协议",
						"path": "web知识/04-文件上传/上传参数与细节.md",
						"order": 6,
						"tags": [
							"nss",
							"file_get_contents",
							"流封装",
							"php://input",
							"data://",
							"HackBar"
						],
						"source": "nss 文件读取参数"
					},
					{
						"id": "web知识/04-文件上传/file_put_contents写入文件",
						"title": "file_put_contents 写入 webshell",
						"path": "web知识/04-文件上传/file_put_contents写入文件.md",
						"order": 7,
						"tags": [
							"file_put_contents",
							"目录穿越",
							"webshell",
							"写文件",
							"路径拼接",
							"代码执行"
						],
						"source": "PHP 文件操作（file_put_contents）笔记"
					},
					{
						"id": "web知识/04-文件上传/找flag的辅助脚本",
						"title": "找 flag 的辅助脚本",
						"path": "web知识/04-文件上传/找flag的辅助脚本.md",
						"order": 8,
						"tags": [
							"geek.ctfplus",
							"webshell",
							"find",
							"自动化",
							"回显"
						],
						"source": "geek.ctfplus.cn 靶场"
					}
				]
			},
			{
				"id": "web知识/05-文件包含",
				"title": "文件包含",
				"children": [
					{
						"id": "web知识/05-文件包含/文件包含漏洞原理与前置条件",
						"title": "文件包含漏洞原理与前置条件",
						"path": "web知识/05-文件包含/文件包含漏洞原理与前置条件.md",
						"order": 1,
						"tags": [
							"文件包含",
							"LFI",
							"RFI",
							"include",
							"require",
							"allow_url_include",
							"allow_url_fopen",
							"伪协议"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/05-文件包含/文件包含利用-伪协议与data",
						"title": "文件包含利用：data:// 与常见伪协议写法",
						"path": "web知识/05-文件包含/文件包含利用-伪协议与data.md",
						"order": 2,
						"tags": [
							"文件包含",
							"data协议",
							"php://filter",
							"伪协议",
							"payload格式",
							"read",
							"write"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/05-文件包含/日志投毒与无文件包含",
						"title": "日志投毒与无文件包含",
						"path": "web知识/05-文件包含/日志投毒与无文件包含.md",
						"order": 3,
						"tags": [
							"文件包含",
							"日志投毒",
							"LFI",
							"access.log",
							"php://input被过滤",
							"无文件包含"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/05-文件包含/题解-web78到web80",
						"title": "文件包含题解：web78～web80（过滤递进与绕过）",
						"path": "web知识/05-文件包含/题解-web78到web80.md",
						"order": 4,
						"tags": [
							"ctfshow",
							"web78",
							"web79",
							"web80",
							"php://filter",
							"data协议",
							"日志包含",
							"str_replace",
							"isset"
						],
						"source": "ctfshow web78"
					},
					{
						"id": "web知识/05-文件包含/文件包含题解综合",
						"title": "文件包含题解：读 flag.php 与「两种根目录」",
						"path": "web知识/05-文件包含/文件包含题解综合.md",
						"order": 5,
						"tags": [
							"文件包含",
							"php://filter",
							"flag.php",
							"网站根目录",
							"文件系统根目录",
							"绝对路径",
							"相对路径"
						],
						"source": "课程笔记"
					}
				]
			},
			{
				"id": "web知识/06-文件读取",
				"title": "文件读取",
				"children": [
					{
						"id": "web知识/06-文件读取/php伪协议读文件",
						"title": "php://filter 读文件与过滤器链",
						"path": "web知识/06-文件读取/php伪协议读文件.md",
						"order": 1,
						"tags": [
							"php://filter",
							"convert.base64-encode",
							"过滤器链",
							"convert.iconv",
							"string.strip_tags",
							"is_file",
							"highlight_file"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/06-文件读取/file协议与路径写法",
						"title": "file:// 协议与三种路径写法",
						"path": "web知识/06-文件读取/file协议与路径写法.md",
						"order": 2,
						"tags": [
							"file协议",
							"绝对路径",
							"相对路径",
							"file:///",
							"本地文件读取"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/06-文件读取/data与php-input对比",
						"title": "data:// 与 php://input 对比",
						"path": "web知识/06-文件读取/data与php-input对比.md",
						"order": 3,
						"tags": [
							"data协议",
							"php://input",
							"allow_url_include",
							"POST",
							"GET",
							"数据流"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/06-文件读取/文件描述符fd与内核结构",
						"title": "文件描述符 fd 与内核数据结构",
						"path": "web知识/06-文件读取/文件描述符fd与内核结构.md",
						"order": 4,
						"tags": [
							"文件描述符",
							"fd",
							"task_struct",
							"files_struct",
							"inode",
							"proc/self/fd",
							"路径绕过"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/06-文件读取/协议基础与包装器对比",
						"title": "协议基础与包装器对比（本分区前置）",
						"path": "web知识/06-文件读取/协议基础与包装器对比.md",
						"order": 5,
						"tags": [
							"OSI",
							"TCP/IP",
							"DNS",
							"URL",
							"绝对路径",
							"相对路径",
							"file协议",
							"dict协议",
							"ftp协议",
							"PHP包装器"
						],
						"source": "课程笔记"
					},
					{
						"id": "web知识/06-文件读取/proc与sys伪文件系统",
						"title": "proc 与 sys 伪文件系统",
						"path": "web知识/06-文件读取/proc与sys伪文件系统.md",
						"order": 6,
						"tags": [
							"proc",
							"/proc/self",
							"sys",
							"信息泄露",
							"文件描述符",
							"容器"
						],
						"source": "geek 靶场 week2"
					}
				]
			},
			{
				"id": "web知识/07-XXE",
				"title": "XXE",
				"children": [
					{
						"id": "web知识/07-XXE/XML与DTD基础",
						"title": "XML 与 DTD 基础",
						"path": "web知识/07-XXE/XML与DTD基础.md",
						"order": 1,
						"tags": [
							"XML",
							"DTD",
							"良构",
							"DOMDocument",
							"SimpleXML",
							"实体引用"
						],
						"source": "课程笔记 2025-10-15"
					},
					{
						"id": "web知识/07-XXE/XML实体类型详解",
						"title": "XML 实体类型详解",
						"path": "web知识/07-XXE/XML实体类型详解.md",
						"order": 2,
						"tags": [
							"XML",
							"实体",
							"通用实体",
							"参数实体",
							"内部实体",
							"外部实体",
							"命名实体"
						],
						"source": "课程笔记 2025-10-15"
					},
					{
						"id": "web知识/07-XXE/XXE漏洞原理与判断",
						"title": "XXE 漏洞原理与判断",
						"path": "web知识/07-XXE/XXE漏洞原理与判断.md",
						"order": 3,
						"tags": [
							"XXE",
							"外部实体",
							"LIBXML_NOENT",
							"DOMDocument",
							"回显",
							"盲注OOB"
						],
						"source": "ctfshow XXE 系列 class06.php（课程笔记 2025-10-18）"
					},
					{
						"id": "web知识/07-XXE/XXE读取文件-php伪协议",
						"title": "XXE 读取文件：php 伪协议的妙用",
						"path": "web知识/07-XXE/XXE读取文件-php伪协议.md",
						"order": 4,
						"tags": [
							"XXE",
							"php伪协议",
							"php://filter",
							"base64",
							"WAF绕过",
							"读取源码"
						],
						"source": "课程笔记 2025-10-19"
					},
					{
						"id": "web知识/07-XXE/XXE-XInclude利用",
						"title": "XXE 之 XInclude 利用",
						"path": "web知识/07-XXE/XXE-XInclude利用.md",
						"order": 5,
						"tags": [
							"XXE",
							"XInclude",
							"xi:include",
							"命名空间",
							"目录遍历",
							"无DTD"
						],
						"source": "课程笔记 2025-10-19"
					},
					{
						"id": "web知识/07-XXE/XXE-SVG载体",
						"title": "XXE 的 SVG 载体",
						"path": "web知识/07-XXE/XXE-SVG载体.md",
						"order": 6,
						"tags": [
							"XXE",
							"SVG",
							"文件上传",
							"图片解析",
							"OOB"
						],
						"source": "课程笔记 2025-10-19"
					},
					{
						"id": "web知识/07-XXE/XXE-expect扩展命令执行",
						"title": "XXE 之 expect 扩展命令执行",
						"path": "web知识/07-XXE/XXE-expect扩展命令执行.md",
						"order": 7,
						"tags": [
							"XXE",
							"expect",
							"伪协议",
							"命令执行",
							"RCE",
							"base64绕过"
						],
						"source": "课程笔记 2025-10-19"
					}
				]
			},
			{
				"id": "web知识/08-SSRF",
				"title": "SSRF",
				"children": [
					{
						"id": "web知识/08-SSRF/SSRF原理与curl_setopt",
						"title": "SSRF 原理与 curl_setopt 选项的含义",
						"path": "web知识/08-SSRF/SSRF原理与curl_setopt.md",
						"order": 1,
						"tags": [
							"SSRF",
							"ctfshow",
							"web351",
							"curl_setopt",
							"CURLOPT_RETURNTRANSFER",
							"CURLOPT_FOLLOWLOCATION",
							"file协议"
						],
						"source": "ctfshow web351"
					},
					{
						"id": "web知识/08-SSRF/SSRF协议利用与内网探测",
						"title": "SSRF 协议利用与内网探测",
						"path": "web知识/08-SSRF/SSRF协议利用与内网探测.md",
						"order": 2,
						"tags": [
							"SSRF",
							"file协议",
							"dict协议",
							"http协议",
							"/proc/net/arp",
							"/proc/net/fib_trie",
							"目录扫描",
							"Intruder"
						],
						"source": "ctfshow SSRF 系列"
					},
					{
						"id": "web知识/08-SSRF/gopher协议打内网服务",
						"title": "gopher 协议打内网服务",
						"path": "web知识/08-SSRF/gopher协议打内网服务.md",
						"order": 3,
						"tags": [
							"SSRF",
							"gopher",
							"Gopherus",
							"Redis",
							"MySQL",
							"FastCGI",
							"URL编码",
							"二次编码"
						],
						"source": "ctfshow SSRF 系列"
					},
					{
						"id": "web知识/08-SSRF/环回地址与DNS重绑定绕过",
						"title": "环回地址变形与 DNS 重绑定绕过",
						"path": "web知识/08-SSRF/环回地址与DNS重绑定绕过.md",
						"order": 4,
						"tags": [
							"SSRF",
							"环回地址",
							"127.0.0.1",
							"进制转换",
							"DNS重绑定",
							"TTL",
							"web355",
							"黑名单绕过"
						],
						"source": "ctfshow web355"
					},
					{
						"id": "web知识/08-SSRF/302重定向绕过",
						"title": "302 重定向绕过 SSRF 校验",
						"path": "web知识/08-SSRF/302重定向绕过.md",
						"order": 5,
						"tags": [
							"SSRF",
							"302重定向",
							"Location",
							"ctfshow",
							"web354",
							"web357",
							"filter_var",
							"FOLLOWLOCATION"
						],
						"source": "ctfshow web354 web357"
					},
					{
						"id": "web知识/08-SSRF/URL解析差异与首位绕过",
						"title": "URL 解析差异与首尾锚点绕过",
						"path": "web知识/08-SSRF/URL解析差异与首位绕过.md",
						"order": 6,
						"tags": [
							"SSRF",
							"ctfshow",
							"web358",
							"正则绕过",
							"userinfo",
							"@",
							"parse_url",
							"URL语法",
							"锚点"
						],
						"source": "ctfshow web358"
					},
					{
						"id": "web知识/08-SSRF/题解-web359与攻击机环境排错",
						"title": "web359 题解：gopher 打 MySQL 与攻击机环境排错",
						"path": "web知识/08-SSRF/题解-web359与攻击机环境排错.md",
						"order": 7,
						"tags": [
							"SSRF",
							"ctfshow",
							"web359",
							"gopher",
							"Gopherus",
							"MySQL",
							"into outfile",
							"webshell",
							"php-fpm",
							"Nginx"
						],
						"source": "ctfshow web359"
					}
				]
			},
			{
				"id": "web知识/09-SSTI",
				"title": "SSTI",
				"children": [
					{
						"id": "web知识/09-SSTI/SSTI原理与Flask模板引擎",
						"title": "SSTI 原理与 Flask 模板引擎",
						"path": "web知识/09-SSTI/SSTI原理与Flask模板引擎.md",
						"order": 1,
						"tags": [
							"SSTI",
							"Flask",
							"Jinja2",
							"render_template_string",
							"模板注入",
							"7*7",
							"format"
						],
						"source": "课程笔记 20251011"
					},
					{
						"id": "web知识/09-SSTI/SSTI基础利用与继承链",
						"title": "SSTI 基础利用与继承链",
						"path": "web知识/09-SSTI/SSTI基础利用与继承链.md",
						"order": 2,
						"tags": [
							"SSTI",
							"Jinja2",
							"继承链",
							"__subclasses__",
							"__globals__",
							"popen",
							"魔术方法",
							"request"
						],
						"source": "课程笔记 20251011"
					},
					{
						"id": "web知识/09-SSTI/SSTI文件读取",
						"title": "SSTI 文件读取",
						"path": "web知识/09-SSTI/SSTI文件读取.md",
						"order": 3,
						"tags": [
							"SSTI",
							"FileLoader",
							"get_data",
							"builtins",
							"open",
							"无回显",
							"输出过滤"
						],
						"source": "课程笔记 20251011"
					},
					{
						"id": "web知识/09-SSTI/SSTI获取config与os函数调用",
						"title": "SSTI 获取 config 与 os 函数调用",
						"path": "web知识/09-SSTI/SSTI获取config与os函数调用.md",
						"order": 4,
						"tags": [
							"SSTI",
							"config",
							"current_app",
							"url_for",
							"lipsum",
							"os.popen",
							"_wrap_close",
							"importlib",
							"linecache"
						],
						"source": "课程笔记 20251014"
					},
					{
						"id": "web知识/09-SSTI/SSTI过滤绕过",
						"title": "SSTI 过滤绕过",
						"path": "web知识/09-SSTI/SSTI过滤绕过.md",
						"order": 5,
						"tags": [
							"SSTI",
							"WAF绕过",
							"__getitem__",
							"attr",
							"request",
							"length",
							"dict",
							"join",
							"符号构造",
							"reverse",
							"replace",
							"chr",
							"print",
							"\"{% %}\""
						],
						"source": "课程笔记 20251014"
					},
					{
						"id": "web知识/09-SSTI/无回显SSTI",
						"title": "无回显 SSTI",
						"path": "web知识/09-SSTI/无回显SSTI.md",
						"order": 6,
						"tags": [
							"SSTI",
							"无回显",
							"盲注",
							"反弹shell",
							"带外OOB",
							"时间盲注"
						],
						"source": "课程笔记 20251014"
					},
					{
						"id": "web知识/09-SSTI/靶场环境搭建与排错",
						"title": "SSTI 靶场环境搭建与排错",
						"path": "web知识/09-SSTI/靶场环境搭建与排错.md",
						"order": 7,
						"tags": [
							"Flask",
							"Docker",
							"venv",
							"靶场搭建",
							"排错",
							"Flask变量规则",
							"路由",
							"redirect",
							"表单",
							"联调"
						],
						"source": "课程笔记 20251010、20251011、20251013"
					},
					{
						"id": "web知识/09-SSTI/题解-web361",
						"title": "web361 Flask SSTI 入门（未知参数名 + 免索引利用）",
						"path": "web知识/09-SSTI/题解-web361.md",
						"order": 8,
						"tags": [
							"ctfshow",
							"web361",
							"SSTI",
							"Jinja2",
							"_wrap_close",
							"startswith过滤",
							"参数探测"
						],
						"source": "ctfshow web361"
					},
					{
						"id": "web知识/09-SSTI/题解-web363",
						"title": "web363 Flask SSTI 参数化利用（url_for 直取）",
						"path": "web知识/09-SSTI/题解-web363.md",
						"order": 9,
						"tags": [
							"ctfshow",
							"web363",
							"SSTI",
							"url_for",
							"__globals__",
							"request.args",
							"参数化"
						],
						"source": "ctfshow web363"
					},
					{
						"id": "web知识/09-SSTI/题解-web364与web365",
						"title": "web364 与 web365 Flask SSTI（args 被过滤 / 无中括号利用）",
						"path": "web知识/09-SSTI/题解-web364与web365.md",
						"order": 10,
						"tags": [
							"ctfshow",
							"web364",
							"web365",
							"SSTI",
							"request.values",
							"__getitem__",
							"点号访问",
							"os.popen"
						],
						"source": "ctfshow web364、web365"
					}
				]
			},
			{
				"id": "web知识/10-PHP反序列化",
				"title": "PHP反序列化",
				"children": [
					{
						"id": "web知识/10-PHP反序列化/序列化与反序列化基础",
						"title": "序列化与反序列化基础",
						"path": "web知识/10-PHP反序列化/序列化与反序列化基础.md",
						"order": 1,
						"tags": [
							"serialize",
							"unserialize",
							"序列化格式",
							"urldecode",
							"private",
							"protected",
							"属性可见性"
						],
						"source": "PHP 反序列化课程笔记"
					},
					{
						"id": "web知识/10-PHP反序列化/PHP面向对象与类",
						"title": "PHP 面向对象与类",
						"path": "web知识/10-PHP反序列化/PHP面向对象与类.md",
						"order": 2,
						"tags": [
							"面向对象",
							"class",
							"实例化",
							"$this",
							"访问修饰符",
							"public",
							"protected",
							"private",
							"对象嵌套"
						],
						"source": "PHP 反序列化课程笔记"
					},
					{
						"id": "web知识/10-PHP反序列化/魔术方法详解",
						"title": "魔术方法详解",
						"path": "web知识/10-PHP反序列化/魔术方法详解.md",
						"order": 3,
						"tags": [
							"魔术方法",
							"__construct",
							"__destruct",
							"__wakeup",
							"__sleep",
							"__toString",
							"__invoke",
							"__call",
							"__get",
							"__set",
							"触发时机"
						],
						"source": "PHP 反序列化课程笔记"
					},
					{
						"id": "web知识/10-PHP反序列化/反序列化漏洞原理与实例",
						"title": "反序列化漏洞原理与实例",
						"path": "web知识/10-PHP反序列化/反序列化漏洞原理与实例.md",
						"order": 4,
						"tags": [
							"unserialize",
							"漏洞成因",
							"eval",
							"属性可控",
							"魔术方法",
							"代码执行"
						],
						"source": "PHP 反序列化课程笔记"
					},
					{
						"id": "web知识/10-PHP反序列化/POP链构造",
						"title": "POP 链构造",
						"path": "web知识/10-PHP反序列化/POP链构造.md",
						"order": 5,
						"tags": [
							"POP链",
							"面向属性编程",
							"POC",
							"魔术方法链",
							"对象嵌套",
							"__destruct",
							"eval",
							"构造方法"
						],
						"source": "NSSCTF 简单例题 + PHP 反序列化课程笔记"
					},
					{
						"id": "web知识/10-PHP反序列化/字符逃逸与字符增多",
						"title": "字符逃逸与字符增多",
						"path": "web知识/10-PHP反序列化/字符逃逸与字符增多.md",
						"order": 6,
						"tags": [
							"字符逃逸",
							"字符串增多",
							"str_replace",
							"长度字段",
							"serialize",
							"unserialize",
							"web262",
							"token"
						],
						"source": "ctfshow web262"
					},
					{
						"id": "web知识/10-PHP反序列化/绕过wakeup与正则过滤",
						"title": "绕过 __wakeup 与正则过滤",
						"path": "web知识/10-PHP反序列化/绕过wakeup与正则过滤.md",
						"order": 7,
						"tags": [
							"__wakeup",
							"CVE-2016-7124",
							"属性数量不匹配",
							"Serializable",
							"C格式",
							"base64",
							"preg_match",
							"O:+"
						],
						"source": "PHP 反序列化课程笔记"
					},
					{
						"id": "web知识/10-PHP反序列化/序列化格式细节绕过",
						"title": "序列化格式细节绕过",
						"path": "web知识/10-PHP反序列化/序列化格式细节绕过.md",
						"order": 8,
						"tags": [
							"大写S",
							"十六进制转义",
							"类名大小写",
							"protected",
							"private",
							"%00",
							"R引用",
							"解析器宽容",
							"绕过手法对照表"
						],
						"source": "PHP 反序列化课程笔记"
					},
					{
						"id": "web知识/10-PHP反序列化/SoapClient反序列化与SSRF",
						"title": "SoapClient 反序列化与伪造 SSRF",
						"path": "web知识/10-PHP反序列化/SoapClient反序列化与SSRF.md",
						"order": 9,
						"tags": [
							"SoapClient",
							"__call",
							"SSRF",
							"CRLF注入",
							"user_agent",
							"内置类",
							"对象注入",
							"web259"
						],
						"source": "web259（soup 以及伪造 ssrf）"
					},
					{
						"id": "web知识/10-PHP反序列化/题解-web255",
						"title": "题解-web255（改 isVip 过 VIP 校验）",
						"path": "web知识/10-PHP反序列化/题解-web255.md",
						"order": 10,
						"tags": [
							"web255",
							"ctfShowUser",
							"isVip",
							"cookie",
							"unserialize",
							"布尔属性",
							"VIP"
						],
						"source": "web255"
					},
					{
						"id": "web知识/10-PHP反序列化/题解-web257",
						"title": "题解-web257（嵌套对象 + 命令执行 + 定位 flag）",
						"path": "web知识/10-PHP反序列化/题解-web257.md",
						"order": 11,
						"tags": [
							"web257",
							"ctfShowUser",
							"backDoor",
							"private属性",
							"对象嵌套",
							"system",
							"flag路径",
							"find"
						],
						"source": "web257（创造 payload 以及查询文件路径）"
					},
					{
						"id": "web知识/10-PHP反序列化/题解-web258",
						"title": "题解-web258（O:+ 绕过滤 + 二次注入 eval）",
						"path": "web知识/10-PHP反序列化/题解-web258.md",
						"order": 12,
						"tags": [
							"web258",
							"O:+数字",
							"正则绕过",
							"eval",
							"$_POST",
							"private属性",
							"ctfShowUser",
							"backDoor",
							"二次调用"
						],
						"source": "web258"
					},
					{
						"id": "web知识/10-PHP反序列化/题解-web261",
						"title": "题解-web261（__unserialize 顶掉 __wakeup）",
						"path": "web知识/10-PHP反序列化/题解-web261.md",
						"order": 13,
						"tags": [
							"web261",
							"__unserialize",
							"__wakeup",
							"PHP7.4",
							"弱比较",
							"属性赋值",
							"魔术方法优先级",
							"ctfShowvip"
						],
						"source": "web261（序列化赋值格式以及弱比较加漏洞）"
					},
					{
						"id": "web知识/10-PHP反序列化/题解-web263-dirmap与session",
						"title": "题解-web263（dirmap 扫目录 + Session 反序列化）",
						"path": "web知识/10-PHP反序列化/题解-web263-dirmap与session.md",
						"order": 14,
						"tags": [
							"web263",
							"dirmap",
							"session反序列化",
							"serialize_handler",
							"php_serialize",
							"session_start",
							"upload_progress",
							"file_put_contents",
							"错位解析"
						],
						"source": "web263（dirmap 加 session）"
					}
				]
			},
			{
				"id": "web知识/12-爆破",
				"title": "爆破",
				"children": [
					{
						"id": "web知识/12-爆破/HTTP-Basic认证爆破",
						"title": "HTTP Basic 认证爆破",
						"path": "web知识/12-爆破/HTTP-Basic认证爆破.md",
						"order": 5,
						"tags": [
							"HTTPBasic",
							"WWW-Authenticate",
							"401",
							"Burp",
							"狙击枪",
							"自定义迭代器",
							"base64"
						],
						"source": ""
					},
					{
						"id": "web知识/12-爆破/php_mt_seed-伪随机种子爆破",
						"title": "php_mt_seed：PHP 伪随机种子爆破",
						"path": "web知识/12-爆破/php_mt_seed-伪随机种子爆破.md",
						"order": 6,
						"tags": [
							"php_mt_seed",
							"mt_rand",
							"mt_srand",
							"伪随机",
							"种子",
							"CTF"
						],
						"source": ""
					}
				]
			}
		]
	},
	{
		"id": "11-逻辑漏洞",
		"title": "逻辑漏洞",
		"children": []
	},
	{
		"id": "13-实战与攻击链",
		"title": "实战与攻击链",
		"children": [
			{
				"id": "13-实战与攻击链/漏洞复现的方法论",
				"title": "漏洞复现的方法论",
				"path": "13-实战与攻击链/漏洞复现的方法论.md",
				"order": 1,
				"tags": [
					"漏洞复现",
					"受控环境",
					"PoC",
					"影响评估",
					"复现流程",
					"原型污染"
				],
				"source": "课程实战 复现漏洞的核心目的"
			},
			{
				"id": "13-实战与攻击链/预认证RCE与React2Shell",
				"title": "预认证 RCE 与 React2Shell",
				"path": "13-实战与攻击链/预认证RCE与React2Shell.md",
				"order": 2,
				"tags": [
					"RCE",
					"预认证",
					"pre-auth",
					"React",
					"RSC",
					"Flight协议",
					"Server Action",
					"Next.js",
					"反序列化",
					"CVE-2025-55182"
				],
				"source": "课程 week2"
			},
			{
				"id": "13-实战与攻击链/Next-Action头部与框架漏洞",
				"title": "Next-Action 头部与框架漏洞",
				"path": "13-实战与攻击链/Next-Action头部与框架漏洞.md",
				"order": 3,
				"tags": [
					"Next.js",
					"Server Action",
					"Next-Action",
					"Flight协议",
					"攻击面",
					"抓包"
				],
				"source": "课程 week2 · Next-Action 头部解析"
			},
			{
				"id": "13-实战与攻击链/挖矿应急响应与主机排查",
				"title": "挖矿应急响应与主机排查",
				"path": "13-实战与攻击链/挖矿应急响应与主机排查.md",
				"order": 4,
				"tags": [
					"挖矿",
					"应急响应",
					"进程排查",
					"ld.so.preload",
					"crontab持久化",
					"chattr",
					"rootkit"
				],
				"source": "应急响应实录 20251218"
			}
		]
	},
	{
		"id": "14-工具与环境",
		"title": "工具与环境",
		"children": [
			{
				"id": "14-工具与环境/靶场与实验环境搭建",
				"title": "靶场与实验环境搭建",
				"path": "14-工具与环境/靶场与实验环境搭建.md",
				"order": 1,
				"tags": [
					"靶场",
					"实验环境",
					"拓扑",
					"监听器",
					"团队服务器",
					"信标",
					"服务扫描",
					"站点克隆",
					"载荷",
					"授权演练"
				],
				"source": "课程 week1"
			},
			{
				"id": "14-工具与环境/服务器与端口转发",
				"title": "服务器初始化与端口转发",
				"path": "14-工具与环境/服务器与端口转发.md",
				"order": 2,
				"tags": [
					"apt",
					"nginx",
					"mysql",
					"docker",
					"docker-compose",
					"SSH",
					"端口转发",
					"本地转发",
					"远程转发",
					"动态转发",
					"SOCKS"
				],
				"source": "课程 week1 · 服务器初始化"
			},
			{
				"id": "14-工具与环境/SSTI自动化工具-fenjing",
				"title": "SSTI 自动化工具 fenjing",
				"path": "14-工具与环境/SSTI自动化工具-fenjing.md",
				"order": 3,
				"tags": [
					"fenjing",
					"SSTI",
					"模板注入",
					"WAF绕过",
					"自动化利用",
					"Jinja2",
					"靶场"
				],
				"source": "课程 base fenjing"
			},
			{
				"id": "14-工具与环境/Linux进程排查命令-ps与top",
				"title": "Linux 进程排查命令 ps 与 top",
				"path": "14-工具与环境/Linux进程排查命令-ps与top.md",
				"order": 4,
				"tags": [
					"ps",
					"top",
					"进程排查",
					"STAT",
					"应急响应",
					"watchdog"
				],
				"source": "应急响应实录 20251218"
			}
		]
	}
];
