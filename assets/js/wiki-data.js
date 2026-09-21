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
		"id": "工控安全",
		"title": "工控安全",
		"children": [
			{
				"id": "00-工控基础",
				"title": "工控基础",
				"children": [
					{
						"id": "00-工控基础/工控是什么",
						"title": "工控是什么",
						"path": "00-工控基础/工控是什么.md",
						"order": 1,
						"tags": [
							"OT",
							"IT",
							"可用性优先"
						],
						"source": "工控协议.md、工控协议权威资料与学习方案.md"
					},
					{
						"id": "00-工控基础/分层与分区",
						"title": "分层与分区",
						"path": "00-工控基础/分层与分区.md",
						"order": 2,
						"tags": [
							"IEC 62443",
							"Zone",
							"安全分区"
						],
						"source": "风电场系统安全区归属表.md、IEC 62443.md、安全设备VM部署与边界策略.md"
					},
					{
						"id": "00-工控基础/点表与寄存器",
						"title": "点表与寄存器",
						"path": "00-工控基础/点表与寄存器.md",
						"order": 3,
						"tags": [
							"点表",
							"Holding Register",
							"点号"
						],
						"source": "风电场点表与数据模型设计.md、工控协议.md、平原链攻击链指南.md"
					},
					{
						"id": "00-工控基础/威胁模型",
						"title": "威胁模型",
						"path": "00-工控基础/威胁模型.md",
						"order": 4,
						"tags": [
							"ICS ATT&CK",
							"战术链",
							"攻击面"
						],
						"source": "ICS ATT&CK.md、工控协议权威资料与学习方案.md、三条攻击链指南"
					}
				],
				"order": 0
			},
			{
				"id": "01-工控设备",
				"title": "工控设备",
				"children": [
					{
						"id": "01-工控设备/HMI与SCADA",
						"title": "HMI与SCADA",
						"path": "01-工控设备/HMI与SCADA.md",
						"order": 1,
						"tags": [
							"HMI",
							"SCADA",
							"组态"
						],
						"source": "工控协议.md、风电场点表与数据模型设计.md、平原链攻击链指南.md"
					},
					{
						"id": "01-工控设备/PLC与RTU",
						"title": "PLC与RTU",
						"path": "01-工控设备/PLC与RTU.md",
						"order": 2,
						"tags": [
							"PLC",
							"RTU",
							"Modbus"
						],
						"source": "工控协议.md、风电场点表与数据模型设计.md、平原链攻击链指南.md"
					},
					{
						"id": "01-工控设备/网关前置机",
						"title": "网关前置机",
						"path": "01-工控设备/网关前置机.md",
						"order": 3,
						"tags": [
							"通信网关",
							"前置机",
							"DTU"
						],
						"source": "平原链攻击链指南.md、工控协议权威资料与学习方案.md、风电场点表与数据模型设计.md"
					},
					{
						"id": "01-工控设备/IED与升压站",
						"title": "IED与升压站",
						"path": "01-工控设备/IED与升压站.md",
						"order": 4,
						"tags": [
							"IED",
							"IEC 61850",
							"保护联锁"
						],
						"source": "工控协议.md、风电场点表与数据模型设计.md、风电场系统安全区归属表.md"
					},
					{
						"id": "01-工控设备/Historian",
						"title": "Historian",
						"path": "01-工控设备/Historian.md",
						"order": 5,
						"tags": [
							"历史库",
							"时序数据",
							"审计"
						],
						"source": "风电场点表与数据模型设计.md、风电场系统安全区归属表.md、工控协议权威资料与学习方案.md"
					},
					{
						"id": "01-工控设备/工程师站",
						"title": "工程师站",
						"path": "01-工控设备/工程师站.md",
						"order": 6,
						"tags": [
							"工程师站",
							"远程维护",
							"高价值跳板"
						],
						"source": "风电场系统安全区归属表.md、工控协议权威资料与学习方案.md、三条攻击链指南"
					},
					{
						"id": "01-工控设备/边界设备",
						"title": "边界设备",
						"path": "01-工控设备/边界设备.md",
						"order": 7,
						"tags": [
							"工业防火墙",
							"隔离装置",
							"纵向加密"
						],
						"source": "安全设备VM部署与边界策略.md、风电场系统安全区归属表.md、工控协议.md"
					}
				],
				"order": 1
			},
			{
				"id": "02-Modbus",
				"title": "Modbus",
				"children": [
					{
						"id": "02-Modbus/通信模型",
						"title": "Modbus 通信模型：主从轮询",
						"path": "02-Modbus/通信模型.md",
						"order": 1,
						"tags": [
							"Modbus",
							"主从模型",
							"Unit ID",
							"功能码",
							"数据模型",
							"502"
						],
						"source": "部署参考资料/工控协议.md、攻击链最后形态/平原链攻击链指南.md、工控协议系统学习资料/工控协议权威资料与学习方案.md"
					},
					{
						"id": "02-Modbus/报文结构",
						"title": "Modbus TCP 报文结构逐字节",
						"path": "02-Modbus/报文结构.md",
						"order": 2,
						"tags": [
							"Modbus",
							"MBAP",
							"PDU",
							"FC03",
							"FC06",
							"异常码",
							"报文结构"
						],
						"source": "部署参考资料/工控协议.md、攻击链最后形态/平原链攻击链指南.md；帧示例按 Modbus Application Protocol 规范推导"
					},
					{
						"id": "02-Modbus/抓包分析",
						"title": "Modbus 抓包分析：从链路看读写",
						"path": "02-Modbus/抓包分析.md",
						"order": 3,
						"tags": [
							"Modbus",
							"抓包",
							"tcpdump",
							"Wireshark",
							"明文",
							"事务标识"
						],
						"source": "平原链攻击链指南.md（modpoll 实测输出）、部署参考资料/2026-07-26_山区IEC104三风机测试流量MITM抓包修复记录.md（抓包方法与注意事项）"
					},
					{
						"id": "02-Modbus/点表映射",
						"title": "点表映射：HR0-HR94 与业务语义",
						"path": "02-Modbus/点表映射.md",
						"order": 4,
						"tags": [
							"点表",
							"保持寄存器",
							"HR93",
							"量纲",
							"安全范围",
							"权限"
						],
						"source": "攻击链最后形态/平原链攻击链指南.md（pointmap.csv 原文）、部署参考资料/风电场点表与数据模型设计.md"
					},
					{
						"id": "02-Modbus/攻击面",
						"title": "Modbus 攻击面与防护",
						"path": "02-Modbus/攻击面.md",
						"order": 5,
						"tags": [
							"Modbus",
							"攻击面",
							"Rogue Master",
							"数据篡改",
							"工业防火墙",
							"防护"
						],
						"source": "攻击链最后形态/平原链攻击链指南.md、工控协议系统学习资料/协议攻击点布设模板.md、工控协议权威资料与学习方案.md"
					}
				],
				"order": 2
			},
			{
				"id": "03-IEC104",
				"title": "IEC104",
				"children": [
					{
						"id": "03-IEC104/远动四遥",
						"title": "IEC 104 与远动四遥",
						"path": "03-IEC104/远动四遥.md",
						"order": 1,
						"tags": [
							"IEC104",
							"IEC60870-5-104",
							"遥测",
							"遥信",
							"遥控",
							"遥调",
							"2404",
							"调度"
						],
						"source": "部署参考资料/工控协议.md、工控协议系统学习资料/工控协议权威资料与学习方案.md、攻击链最后形态/山区攻击链指南.md"
					},
					{
						"id": "03-IEC104/报文结构",
						"title": "IEC 104 报文结构：APCI 与 ASDU",
						"path": "03-IEC104/报文结构.md",
						"order": 2,
						"tags": [
							"IEC104",
							"APCI",
							"ASDU",
							"控制域",
							"I帧",
							"S帧",
							"U帧",
							"字节序"
						],
						"source": "攻击链最后形态/山区攻击链指南.md、部署参考资料/iec104_3fan_single_direct_20260726.pcap（实测帧）"
					},
					{
						"id": "03-IEC104/关键字段",
						"title": "IEC 104 关键字段：谁决定什么",
						"path": "03-IEC104/关键字段.md",
						"order": 3,
						"tags": [
							"IEC104",
							"TypeID",
							"COT",
							"IOA",
							"CA",
							"SBO",
							"SCO",
							"关键字段"
						],
						"source": "攻击链最后形态/山区攻击链指南.md、03-IEC104/报文结构.md（字段定义）、实测 pcap"
					},
					{
						"id": "03-IEC104/抓包分析",
						"title": "IEC 104 抓包分析：实测逐帧拆解",
						"path": "03-IEC104/抓包分析.md",
						"order": 4,
						"tags": [
							"IEC104",
							"抓包",
							"pcap",
							"tcpdump",
							"MITM",
							"IOA映射",
							"字节序",
							"序号"
						],
						"source": "部署参考资料/iec104_3fan_single_direct_20260726.pcap 等 5 个实测 pcap、2026-07-26_山区IEC104三风机测试流量MITM抓包修复记录.md、2026-07-25_frontend3-lower_IEC104自动测试流量服务部署记录.md"
					},
					{
						"id": "03-IEC104/链路异常",
						"title": "IEC 104 链路异常：序号漂移、重放与注入",
						"path": "03-IEC104/链路异常.md",
						"order": 5,
						"tags": [
							"IEC104",
							"APCI",
							"序号漂移",
							"starvation",
							"重放",
							"报文注入",
							"DEGRADED"
						],
						"source": "部署参考资料/山区主链新测试方法-IEC104会话异常与报文注入.md、2026-07-25_frontend3-lower_IEC104自动测试流量服务部署记录.md"
					},
					{
						"id": "03-IEC104/攻击面",
						"title": "IEC 104 攻击面与防护",
						"path": "03-IEC104/攻击面.md",
						"order": 6,
						"tags": [
							"IEC104",
							"攻击面",
							"Test位",
							"SBO",
							"纵向加密",
							"工业防火墙",
							"防护"
						],
						"source": "攻击链最后形态/山区攻击链指南.md、部署参考资料/山区主链新测试方法-IEC104会话异常与报文注入.md、工控协议系统学习资料/协议攻击点布设模板.md、2026-07-25_山区IEC104_RogueMaster自写脚本攻击步骤改造记录.md"
					}
				],
				"order": 3
			},
			{
				"id": "04-OPCUA",
				"title": "OPCUA",
				"children": [
					{
						"id": "04-OPCUA/地址空间",
						"title": "OPC UA 地址空间与节点",
						"path": "04-OPCUA/地址空间.md",
						"order": 1,
						"tags": [
							"OPCUA",
							"地址空间",
							"NodeId",
							"命名空间",
							"信息模型"
						],
						"source": "海上链攻击链指南.md、工控协议.md、2026-07-24_offshore-opcua-gateway部署记录.md、2026-07-26_海上OPCUA三风机对象模型与独立控制改造记录.md"
					},
					{
						"id": "04-OPCUA/通信流程",
						"title": "OPC UA 通信流程与安全模式",
						"path": "04-OPCUA/通信流程.md",
						"order": 2,
						"tags": [
							"OPCUA",
							"端点",
							"SecureChannel",
							"Session",
							"SecurityMode",
							"服务集"
						],
						"source": "海上链攻击链指南.md、工控协议.md、工控协议权威资料与学习方案.md"
					},
					{
						"id": "04-OPCUA/报文与抓包",
						"title": "OPC UA 报文结构与抓包分析",
						"path": "04-OPCUA/报文与抓包.md",
						"order": 3,
						"tags": [
							"OPCUA",
							"抓包",
							"Wireshark",
							"二进制编码",
							"MethodCall"
						],
						"source": "海上链攻击链指南.md、工控协议.md"
					},
					{
						"id": "04-OPCUA/方法调用",
						"title": "OPC UA 方法调用与保护停机实测",
						"path": "04-OPCUA/方法调用.md",
						"order": 4,
						"tags": [
							"OPCUA",
							"MethodCall",
							"保护停机",
							"Modbus",
							"攻击链"
						],
						"source": "海上链攻击链指南.md、工控协议.md、2026-07-24_offshore-opcua-gateway部署记录.md、2026-07-25_海上OPCUA到Modbus联动与HMI三子站轮询部署记录.md、2026-07-26_海上OPCUA三风机对象模型与独立控制改造记录.md"
					},
					{
						"id": "04-OPCUA/攻击面",
						"title": "OPC UA 攻击面与防护",
						"path": "04-OPCUA/攻击面.md",
						"order": 5,
						"tags": [
							"OPCUA",
							"攻击面",
							"匿名Browse",
							"方法级授权",
							"防护"
						],
						"source": "海上链攻击链指南.md、工控协议.md、工控协议权威资料与学习方案.md、2026-07-24_offshore-opcua-gateway部署记录.md"
					}
				],
				"order": 4
			},
			{
				"id": "05-IEC61850",
				"title": "IEC61850",
				"children": [
					{
						"id": "05-IEC61850/三层结构",
						"title": "IEC 61850 三层结构与信息模型",
						"path": "05-IEC61850/三层结构.md",
						"order": 1,
						"tags": [
							"IEC61850",
							"变电站三层",
							"逻辑节点",
							"SCL",
							"MMS"
						],
						"source": "工控协议.md、2026-07-12_海上GOOSE保护链路部署记录.md、工控协议权威资料与学习方案.md"
					},
					{
						"id": "05-IEC61850/GOOSE报文",
						"title": "GOOSE 报文结构与时序",
						"path": "05-IEC61850/GOOSE报文.md",
						"order": 2,
						"tags": [
							"IEC61850",
							"GOOSE",
							"stNum",
							"sqNum",
							"重放",
							"保护联锁"
						],
						"source": "2026-07-12_海上GOOSE保护链路部署记录.md、工控协议.md、工控协议权威资料与学习方案.md"
					},
					{
						"id": "05-IEC61850/MMS与文件",
						"title": "MMS 通信与 IEC 61850 文件服务",
						"path": "05-IEC61850/MMS与文件.md",
						"order": 3,
						"tags": [
							"IEC61850",
							"MMS",
							"报告控制块",
							"文件服务",
							"102端口"
						],
						"source": "工控协议.md、工控协议权威资料与学习方案.md、2026-07-12_海上GOOSE保护链路部署记录.md"
					},
					{
						"id": "05-IEC61850/攻击面",
						"title": "IEC 61850 攻击面与防护",
						"path": "05-IEC61850/攻击面.md",
						"order": 4,
						"tags": [
							"IEC61850",
							"GOOSE重放",
							"攻击面",
							"防护",
							"压板管理"
						],
						"source": "2026-07-12_海上GOOSE保护链路部署记录.md、工控协议.md、工控协议权威资料与学习方案.md"
					}
				],
				"order": 5
			},
			{
				"id": "06-其他协议",
				"title": "其他协议",
				"children": [
					{
						"id": "06-其他协议/IEC61400-25",
						"title": "IEC 61400-25 风电场通信与信息模型",
						"path": "06-其他协议/IEC61400-25.md",
						"order": 1,
						"tags": [
							"IEC61400-25",
							"风电",
							"信息模型",
							"数据对象"
						],
						"source": "工控协议.md、工控协议权威资料与学习方案.md"
					},
					{
						"id": "06-其他协议/MQTT",
						"title": "MQTT 发布订阅与边缘遥测",
						"path": "06-其他协议/MQTT.md",
						"order": 2,
						"tags": [
							"MQTT",
							"发布订阅",
							"QoS",
							"Retained",
							"ACL"
						],
						"source": "工控协议权威资料与学习方案.md、工控协议.md"
					},
					{
						"id": "06-其他协议/IEC102与645",
						"title": "IEC 60870-5-102 与 DL/T 645 电能量计量链路",
						"path": "06-其他协议/IEC102与645.md",
						"order": 3,
						"tags": [
							"IEC102",
							"DLT645",
							"电能量",
							"计量"
						],
						"source": "工控协议.md"
					},
					{
						"id": "06-其他协议/S7comm",
						"title": "S7 通信与 S7comm 协议",
						"path": "06-其他协议/S7comm.md",
						"order": 4,
						"tags": [
							"S7comm",
							"西门子",
							"PLC",
							"博图"
						],
						"source": "工控协议权威资料与学习方案.md"
					}
				],
				"order": 6
			},
			{
				"id": "07-攻击链复盘",
				"title": "攻击链复盘",
				"children": [
					{
						"id": "07-攻击链复盘/平原链",
						"title": "平原链复盘：SQL 注入 → IDOR 备份 → SSH 网关 → Modbus 写 HR93 归零有功",
						"path": "07-攻击链复盘/平原链.md",
						"order": 1,
						"tags": [
							"复盘",
							"SQL注入",
							"IDOR",
							"Modbus",
							"SCADA",
							"风电"
						],
						"source": "攻击链最后形态/平原链攻击链指南.md、部署参考资料/plain-*部署记录.md"
					},
					{
						"id": "07-攻击链复盘/山区链",
						"title": "山区链复盘：工单存储型 XSS → 维护站凭据 → ARP MITM → IEC104 SBO 遥控停机",
						"path": "07-攻击链复盘/山区链.md",
						"order": 2,
						"tags": [
							"复盘",
							"XSS",
							"MITM",
							"IEC104",
							"SBO",
							"风电"
						],
						"source": "攻击链最后形态/山区攻击链指南.md、部署参考资料/山区主链新测试方法-IEC104会话异常与报文注入.md、山区 3fan pcap"
					},
					{
						"id": "07-攻击链复盘/海上链",
						"title": "海上链复盘：SSRF → JWT Secret 泄露 → Scope 提升 → OPC UA Method Call 保护停机",
						"path": "07-攻击链复盘/海上链.md",
						"order": 3,
						"tags": [
							"复盘",
							"SSRF",
							"JWT",
							"OPCUA",
							"风电",
							"GOOSE"
						],
						"source": "攻击链最后形态/海上链攻击链指南.md、部署参考资料/2026-07-12_海上GOOSE保护链路部署记录.md、offshore-*部署记录.md"
					}
				],
				"order": 7
			},
			{
				"id": "08-工具环境",
				"title": "工具环境",
				"children": [
					{
						"id": "08-工具环境/抓包工具",
						"title": "抓包工具 tcpdump 与 Wireshark",
						"path": "08-工具环境/抓包工具.md",
						"order": 1,
						"tags": [
							"tcpdump",
							"Wireshark",
							"抓包",
							"MITM"
						],
						"source": "2026-07-26_山区IEC104三风机测试流量MITM抓包修复记录.md、山区攻击链指南.md"
					},
					{
						"id": "08-工具环境/Modbus工具",
						"title": "Modbus 工具 modpoll 与 mbpoll",
						"path": "08-工具环境/Modbus工具.md",
						"order": 2,
						"tags": [
							"modpoll",
							"mbpoll",
							"Modbus",
							"pymodbus"
						],
						"source": "2026-07-24_Modbus-Poll-Slave仿真环境检查与部署报告.md、平原链攻击链指南.md"
					},
					{
						"id": "08-工具环境/OPCUA工具",
						"title": "OPC UA 工具 opcua-tools 与图形客户端",
						"path": "08-工具环境/OPCUA工具.md",
						"order": 3,
						"tags": [
							"OPCUA",
							"opcua-tools",
							"asyncua",
							"open62541"
						],
						"source": "海上链攻击链指南.md、工控协议权威资料与学习方案.md"
					},
					{
						"id": "08-工具环境/仿真环境",
						"title": "靶场仿真环境与组件清单",
						"path": "08-工具环境/仿真环境.md",
						"order": 4,
						"tags": [
							"仿真",
							"Docker",
							"Conpot",
							"OpenPLC",
							"Mosquitto"
						],
						"source": "工控协议权威资料与学习方案.md、2026-07-25_Modbus子站Docker化构建记录.md、2026-07-25_Modbus子站Docker镜像导出补充记录.md、2026-07-25_山区HMI与Conpot-IEC104到Modbus联动部署记录.md"
					}
				],
				"order": 8
			}
		]
	},
	{
		"id": "蜜罐研究",
		"title": "蜜罐研究",
		"children": [
			{
				"id": "00-蜜罐基础",
				"title": "蜜罐基础",
				"children": [
					{
						"id": "00-蜜罐基础/概念",
						"title": "概念",
						"path": "00-蜜罐基础/概念.md",
						"order": 1,
						"tags": [
							"蜜罐",
							"诱捕",
							"欺骗防御",
							"误报",
							"威胁情报"
						],
						"source": "01-蜜罐技术基础调研.md"
					},
					{
						"id": "00-蜜罐基础/分类",
						"title": "分类",
						"path": "00-蜜罐基础/分类.md",
						"order": 2,
						"tags": [
							"低交互蜜罐",
							"高交互蜜罐",
							"公网蜜罐",
							"内网诱捕",
							"漏洞专项蜜罐"
						],
						"source": "01-蜜罐技术基础调研.md"
					},
					{
						"id": "00-蜜罐基础/蜜网与蜜标",
						"title": "蜜网与蜜标",
						"path": "00-蜜罐基础/蜜网与蜜标.md",
						"order": 3,
						"tags": [
							"蜜网",
							"蜜标",
							"Canarytoken",
							"集中日志",
							"出网控制"
						],
						"source": "01-蜜罐技术基础调研.md"
					},
					{
						"id": "00-蜜罐基础/采集能力",
						"title": "采集能力",
						"path": "00-蜜罐基础/采集能力.md",
						"order": 4,
						"tags": [
							"日志字段",
							"IOC",
							"Payload",
							"攻击阶段",
							"会话记录"
						],
						"source": "01-蜜罐技术基础调研.md"
					},
					{
						"id": "00-蜜罐基础/价值与风险",
						"title": "价值与风险",
						"path": "00-蜜罐基础/价值与风险.md",
						"order": 5,
						"tags": [
							"安全运营",
							"威胁情报",
							"攻防演练",
							"安全隔离",
							"合规"
						],
						"source": "01-蜜罐技术基础调研.md"
					},
					{
						"id": "00-蜜罐基础/工作方式",
						"title": "工作方式",
						"path": "00-蜜罐基础/工作方式.md",
						"order": 6,
						"tags": [
							"漏洞专项蜜罐",
							"仿真服务",
							"Payload",
							"IOC",
							"检测规则"
						],
						"source": "01-蜜罐技术基础调研.md"
					},
					{
						"id": "00-蜜罐基础/建设路径",
						"title": "建设路径",
						"path": "00-蜜罐基础/建设路径.md",
						"order": 7,
						"tags": [
							"仿真蜜罐",
							"Profile",
							"安全隔离",
							"日志字段",
							"双线推进"
						],
						"source": "01-蜜罐技术基础调研.md、03-漏洞专项蜜罐案例分析与最佳方案.md"
					}
				],
				"order": 0
			},
			{
				"id": "01-蜜罐工具",
				"title": "蜜罐工具",
				"children": [
					{
						"id": "01-蜜罐工具/Cowrie",
						"title": "Cowrie",
						"path": "01-蜜罐工具/Cowrie.md",
						"order": 1,
						"tags": [
							"SSH蜜罐",
							"Telnet",
							"中交互",
							"弱口令爆破",
							"命令记录"
						],
						"source": "02-主流蜜罐工具对比.md、04-竞品调研报告.md"
					},
					{
						"id": "01-蜜罐工具/OpenCanary",
						"title": "OpenCanary",
						"path": "01-蜜罐工具/OpenCanary.md",
						"order": 2,
						"tags": [
							"多协议",
							"低交互",
							"内网诱捕",
							"告警"
						],
						"source": "02-主流蜜罐工具对比.md、04-竞品调研报告.md"
					},
					{
						"id": "01-蜜罐工具/Dionaea",
						"title": "Dionaea",
						"path": "01-蜜罐工具/Dionaea.md",
						"order": 3,
						"tags": [
							"多协议",
							"恶意样本捕获",
							"低交互"
						],
						"source": "02-主流蜜罐工具对比.md"
					},
					{
						"id": "01-蜜罐工具/T-Pot",
						"title": "T-Pot",
						"path": "01-蜜罐工具/T-Pot.md",
						"order": 4,
						"tags": [
							"集成平台",
							"可视化",
							"集中日志",
							"开源"
						],
						"source": "02-主流蜜罐工具对比.md、04-竞品调研报告.md"
					},
					{
						"id": "01-蜜罐工具/Conpot",
						"title": "Conpot",
						"path": "01-蜜罐工具/Conpot.md",
						"order": 5,
						"tags": [
							"工控蜜罐",
							"ICS",
							"SCADA",
							"协议仿真"
						],
						"source": "04-竞品调研报告.md、05-现有方案差距分析.md、06-竞品适用场景与优劣对比矩阵.md"
					},
					{
						"id": "01-蜜罐工具/Web蜜罐",
						"title": "Web蜜罐",
						"path": "01-蜜罐工具/Web蜜罐.md",
						"order": 6,
						"tags": [
							"Web蜜罐",
							"HTTP仿真",
							"单CVE",
							"Sensor"
						],
						"source": "04-竞品调研报告.md、06-竞品适用场景与优劣对比矩阵.md"
					},
					{
						"id": "01-蜜罐工具/蜜网工具",
						"title": "蜜网工具",
						"path": "01-蜜罐工具/蜜网工具.md",
						"order": 7,
						"tags": [
							"虚拟蜜罐",
							"网络指纹",
							"低交互"
						],
						"source": "02-主流蜜罐工具对比.md、05-现有方案差距分析.md、06-竞品适用场景与优劣对比矩阵.md"
					},
					{
						"id": "01-蜜罐工具/模板生态",
						"title": "模板生态",
						"path": "01-蜜罐工具/模板生态.md",
						"order": 8,
						"tags": [
							"漏洞模板",
							"Nuclei",
							"YAML",
							"检测规则"
						],
						"source": "04-竞品调研报告.md、06-竞品适用场景与优劣对比矩阵.md"
					},
					{
						"id": "01-蜜罐工具/商业蜜罐",
						"title": "商业蜜罐",
						"path": "01-蜜罐工具/商业蜜罐.md",
						"order": 9,
						"tags": [
							"欺骗防御",
							"商业方案",
							"Canary",
							"威胁情报"
						],
						"source": "04-竞品调研报告.md、05-现有方案差距分析.md、06-竞品适用场景与优劣对比矩阵.md"
					}
				],
				"order": 1
			},
			{
				"id": "02-关键技术",
				"title": "关键技术",
				"children": [
					{
						"id": "02-关键技术/高仿真",
						"title": "高仿真",
						"path": "02-关键技术/高仿真.md",
						"order": 1,
						"tags": [
							"指纹仿真",
							"页面仿真",
							"协议交互"
						],
						"source": "08-漏洞专项蜜罐解决方案设计.md、蜜罐研究任务路线.md"
					},
					{
						"id": "02-关键技术/漏洞仿真",
						"title": "漏洞仿真",
						"path": "02-关键技术/漏洞仿真.md",
						"order": 2,
						"tags": [
							"漏洞行为仿真",
							"弱口令",
							"命令执行",
							"SQL注入",
							"工控异常读写"
						],
						"source": "08-漏洞专项蜜罐解决方案设计.md、蜜罐研究任务路线.md、03-漏洞专项蜜罐案例分析与最佳方案.md"
					},
					{
						"id": "02-关键技术/流量采集",
						"title": "流量采集",
						"path": "02-关键技术/流量采集.md",
						"order": 3,
						"tags": [
							"攻击流量采集",
							"Body留存",
							"协议会话",
							"Payload",
							"JSONL"
						],
						"source": "08-漏洞专项蜜罐解决方案设计.md、07-竞品能力集成设计原则.md、05-现有方案差距分析.md"
					},
					{
						"id": "02-关键技术/攻击画像",
						"title": "攻击画像",
						"path": "02-关键技术/攻击画像.md",
						"order": 4,
						"tags": [
							"产品攻击画像",
							"IP攻击画像",
							"Web攻击分析",
							"攻击态势"
						],
						"source": "蜜罐研究任务路线.md、11-下一代漏洞蜜罐产品方案规划.md、12-Nextrap参考平台审阅与路线修正.md"
					},
					{
						"id": "02-关键技术/情报检索",
						"title": "情报检索",
						"path": "02-关键技术/情报检索.md",
						"order": 5,
						"tags": [
							"情报检索",
							"检索DSL",
							"攻击样本库",
							"攻击上下文日志",
							"路径曝光度"
						],
						"source": "蜜罐研究任务路线.md、12-Nextrap参考平台审阅与路线修正.md"
					}
				],
				"order": 2
			},
			{
				"id": "03-格式规范",
				"title": "格式规范",
				"children": [
					{
						"id": "03-格式规范/Profile设计",
						"title": "Profile设计",
						"path": "03-格式规范/Profile设计.md",
						"order": 1,
						"tags": [
							"CVE Profile",
							"安全优先",
							"生命周期",
							"低交互高仿真"
						],
						"source": "09-CVE Profile 设计规范.md"
					},
					{
						"id": "03-格式规范/Profile字段",
						"title": "Profile字段",
						"path": "03-格式规范/Profile字段.md",
						"order": 2,
						"tags": [
							"Profile 字段",
							"仿真配置",
							"匹配规则",
							"YAML 结构"
						],
						"source": "09-CVE Profile 设计规范.md"
					},
					{
						"id": "03-格式规范/日志字段",
						"title": "日志字段",
						"path": "03-格式规范/日志字段.md",
						"order": 3,
						"tags": [
							"日志字段",
							"JSONL",
							"HTTP 事件",
							"命名规范"
						],
						"source": "10-日志字段与 IOC 输出规范.md"
					},
					{
						"id": "03-格式规范/IOC输出",
						"title": "IOC输出",
						"path": "03-格式规范/IOC输出.md",
						"order": 4,
						"tags": [
							"IOC",
							"归一化",
							"JSON",
							"CSV"
						],
						"source": "10-日志字段与 IOC 输出规范.md"
					},
					{
						"id": "03-格式规范/风险评分",
						"title": "风险评分",
						"path": "03-格式规范/风险评分.md",
						"order": 5,
						"tags": [
							"风险评分",
							"加分规则",
							"降分规则",
							"白名单"
						],
						"source": "10-日志字段与 IOC 输出规范.md"
					}
				],
				"order": 3
			},
			{
				"id": "04-案例",
				"title": "案例",
				"children": [
					{
						"id": "04-案例/建模流程",
						"title": "建模流程",
						"path": "04-案例/建模流程.md",
						"order": 1,
						"tags": [
							"CVE Profile",
							"仿真要素",
							"模板校验",
							"转换可行性"
						],
						"source": "03-漏洞专项蜜罐案例分析与最佳方案.md、06-漏洞库与蜜罐项目对接需求说明.md"
					},
					{
						"id": "04-案例/Log4Shell",
						"title": "Log4Shell",
						"path": "04-案例/Log4Shell.md",
						"order": 2,
						"tags": [
							"Log4Shell",
							"JNDI",
							"单 CVE 专项蜜罐",
							"Log4Pot"
						],
						"source": "03-漏洞专项蜜罐案例分析与最佳方案.md"
					},
					{
						"id": "04-案例/Confluence",
						"title": "Confluence",
						"path": "04-案例/Confluence.md",
						"order": 3,
						"tags": [
							"Confluence RCE",
							"企业应用指纹",
							"可疑表达式",
							"WebShell"
						],
						"source": "03-漏洞专项蜜罐案例分析与最佳方案.md"
					},
					{
						"id": "04-案例/Next.js",
						"title": "Next.js",
						"path": "04-案例/Next.js.md",
						"order": 4,
						"tags": [
							"Next.js",
							"React Server Components",
							"RSC",
							"Server Action"
						],
						"source": "03-漏洞专项蜜罐案例分析与最佳方案.md"
					}
				],
				"order": 4
			}
		]
	},
	{
		"id": "模型构建",
		"title": "模型构建",
		"children": [
			{
				"id": "01-数据工程",
				"title": "数据工程",
				"children": [
					{
						"id": "01-数据工程/安全日志清洗",
						"title": "安全日志清洗",
						"path": "01-数据工程/安全日志清洗.md",
						"order": 1,
						"tags": [
							"日志清洗",
							"离群值",
							"去重",
							"命令行",
							"证据链"
						],
						"source": ""
					},
					{
						"id": "01-数据工程/事件标准化",
						"title": "事件标准化",
						"path": "01-数据工程/事件标准化.md",
						"order": 2,
						"tags": [
							"标准事件",
							"缺失值",
							"唯一标识",
							"标签",
							"分组排序"
						],
						"source": ""
					},
					{
						"id": "01-数据工程/语义表示",
						"title": "语义表示",
						"path": "01-数据工程/语义表示.md",
						"order": 3,
						"tags": [
							"canonical_message",
							"占位符",
							"structured_token",
							"特征工程",
							"special token"
						],
						"source": ""
					},
					{
						"id": "01-数据工程/序列构造",
						"title": "序列构造",
						"path": "01-数据工程/序列构造.md",
						"order": 4,
						"tags": [
							"滑窗",
							"stride",
							"定长张量",
							"样本构造",
							"缓存"
						],
						"source": ""
					},
					{
						"id": "01-数据工程/划分与防泄漏",
						"title": "划分与防泄漏",
						"path": "01-数据工程/划分与防泄漏.md",
						"order": 5,
						"tags": [
							"数据泄漏",
							"分组切分",
							"时间切分",
							"train-only",
							"阈值校准"
						],
						"source": ""
					},
					{
						"id": "01-数据工程/词表与剪枝",
						"title": "词表与剪枝",
						"path": "01-数据工程/词表与剪枝.md",
						"order": 6,
						"tags": [
							"信息增益",
							"优势比",
							"TF-IDF",
							"词表剪枝",
							"支持度"
						],
						"source": ""
					}
				],
				"order": 1
			},
			{
				"id": "02-模型",
				"title": "模型",
				"children": [
					{
						"id": "02-模型/ContraLog架构",
						"title": "ContraLog架构",
						"path": "02-模型/ContraLog架构.md",
						"order": 1,
						"tags": [
							"双编码器",
							"Transformer",
							"MessageEncoder",
							"SequenceEncoder",
							"ONNX契约"
						],
						"source": ""
					},
					{
						"id": "02-模型/评分定义",
						"title": "评分定义",
						"path": "02-模型/评分定义.md",
						"order": 2,
						"tags": [
							"余弦距离",
							"最近邻参考",
							"逐位置重建",
							"特征聚合",
							"计算量"
						],
						"source": ""
					},
					{
						"id": "02-模型/阈值与校准",
						"title": "阈值与校准",
						"path": "02-模型/阈值与校准.md",
						"order": 3,
						"tags": [
							"Robust-Z",
							"median",
							"MAD",
							"分位数阈值",
							"误报率"
						],
						"source": ""
					},
					{
						"id": "02-模型/Tokenizer",
						"title": "Tokenizer",
						"path": "02-模型/Tokenizer.md",
						"order": 4,
						"tags": [
							"分词",
							"子词",
							"词表",
							"特殊token",
							"OOV"
						],
						"source": ""
					},
					{
						"id": "02-模型/变体与蒸馏",
						"title": "变体与蒸馏",
						"path": "02-模型/变体与蒸馏.md",
						"order": 5,
						"tags": [
							"知识蒸馏",
							"遮蔽重建",
							"对比损失",
							"变体",
							"Hit@10"
						],
						"source": ""
					},
					{
						"id": "02-模型/相关方法",
						"title": "相关方法",
						"path": "02-模型/相关方法.md",
						"order": 6,
						"tags": [
							"LogBERT",
							"LAnoBERT",
							"ADALog",
							"DeepLog",
							"模板化",
							"parser-free"
						],
						"source": ""
					}
				],
				"order": 2
			},
			{
				"id": "03-轻量化",
				"title": "轻量化",
				"children": [
					{
						"id": "03-轻量化/轻量化总览",
						"title": "轻量化总览",
						"path": "03-轻量化/轻量化总览.md",
						"order": 1,
						"tags": [
							"量化",
							"缓存",
							"批处理",
							"ONNX",
							"收益排序"
						],
						"source": ""
					},
					{
						"id": "03-轻量化/INT8量化",
						"title": "INT8量化",
						"path": "03-轻量化/INT8量化.md",
						"order": 2,
						"tags": [
							"量化",
							"动态量化",
							"静态量化",
							"校准",
							"组成敏感"
						],
						"source": ""
					},
					{
						"id": "03-轻量化/ONNX部署",
						"title": "ONNX部署",
						"path": "03-轻量化/ONNX部署.md",
						"order": 3,
						"tags": [
							"ONNX",
							"ONNX Runtime",
							"算子融合",
							"动态维度",
							"导出验收"
						],
						"source": ""
					},
					{
						"id": "03-轻量化/缓存",
						"title": "缓存",
						"path": "03-轻量化/缓存.md",
						"order": 4,
						"tags": [
							"embedding缓存",
							"LRU",
							"缓存键",
							"命中率",
							"fail-open"
						],
						"source": ""
					},
					{
						"id": "03-轻量化/批与序列",
						"title": "批与序列",
						"path": "03-轻量化/批与序列.md",
						"order": 5,
						"tags": [
							"batch",
							"吞吐与延迟",
							"线程数",
							"长度分桶",
							"Pareto"
						],
						"source": ""
					},
					{
						"id": "03-轻量化/瓶颈归因",
						"title": "瓶颈归因",
						"path": "03-轻量化/瓶颈归因.md",
						"order": 6,
						"tags": [
							"Amdahl",
							"profiling",
							"采样",
							"冷启动",
							"chunk"
						],
						"source": ""
					},
					{
						"id": "03-轻量化/数值等价",
						"title": "数值等价",
						"path": "03-轻量化/数值等价.md",
						"order": 7,
						"tags": [
							"ONNX",
							"Golden",
							"容差",
							"余弦相似度",
							"哈希"
						],
						"source": ""
					},
					{
						"id": "03-轻量化/漂移度量",
						"title": "漂移度量",
						"path": "03-轻量化/漂移度量.md",
						"order": 8,
						"tags": [
							"Spearman",
							"Top-K重合",
							"排序",
							"决策翻转",
							"阈值重校准"
						],
						"source": ""
					}
				],
				"order": 3
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
