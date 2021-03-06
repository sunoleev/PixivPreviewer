﻿// ==UserScript==
// @name                       Pixiv Previewer
// @namespace              https://github.com/Ocrosoft/PixivPreviewer
// @version                    3.1.14
// @description              Display preview images (support single image, multiple images, moving images); Download animation(.zip); Sorting the search page by favorite count(and display it). Updated for the latest search page.
// @description:zh-CN   显示预览图（支持单图，多图，动图）；动图压缩包下载；搜索页按热门度（收藏数）排序并显示收藏数，适配11月更新。
// @description:ja           プレビュー画像の表示（単一画像、複数画像、動画のサポート）; アニメーションのダウンロード（.zip）; お気に入りの数で検索ページをソートします（そして表示します）。 最新の検索ページ用に更新されました。
// @description:zh_TW   顯示預覽圖像（支持單幅圖像，多幅圖像，運動圖像）； 下載動畫（.zip）; 按收藏夾數對搜索頁進行排序（並顯示）。 已為最新的搜索頁面適配。
// @author                     Ocrosoft
// @match                      *://www.pixiv.net/*
// @grant                       none
// @compatible             Chrome
// ==/UserScript==

// 测试 JQuery，如果不支持就插入
//var $ = function () { };
try {
    $();
} catch (e) {
    var script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-2.2.4.min.js';
    document.head.appendChild(script);
}

// If you want to help improve the translate, please
var Lang = {
    // 中文-中国大陆
    zh_CN: 0,
    // 英语-美国
    en_US: 1,
};
var Texts = {};
Texts[Lang.zh_CN] = {
    // 安装或更新后弹出的提示
    install_title: '欢迎使用 PixivPreviewer v',
    install_body: '<div style="position: absolute;width: 40%;left: 30%;top: 30%;font-size: 20px; color: white;"><p style="text-indent: 2em;">语言更新（v3.0.15）: 这个版本更新了英语翻译，对使用简体/繁体中文版本 Pixiv 的用户没有任何影响。</p><br><p style="text-indent: 2em;"> v3.0.x 是对 v2.08 进行了大量改动后的版本，因此可能不稳定，如果发现问题，请到<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank"> 反馈页面 </a>反馈，我会尽快修复，也欢迎提出建议，非常感谢！</p><p style="text-indent: 2em;">排序功能会比之前的版本慢，具体时间视Pixiv的加载速度而定，原因是新的搜索页面不会再显示排序所必须的收藏量。</p><br><p style="text-indent: 2em;">如果您是第一次使用，推荐到<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> 详情页 </a>查看脚本介绍。</p></div>',
    // 设置项
    setting_preview: '预览',
    setting_sort: '排序（仅搜索页生效）',
    setting_anime: '动图下载（动图预览及详情页生效）',
    setting_origin: '预览时优先显示原图（慢）',
    setting_maxPage: '每次排序时统计的最大页数',
    setting_hideWork: '隐藏收藏数少于设定值的作品',
    setting_hideFav: '排序时隐藏已收藏的作品',
    setting_blank: '使用新标签页打开作品详情页',
    setting_turnPage: '使用键盘←→进行翻页（排序后的搜索页）',
    setting_save: '保存设置',
    setting_reset: '重置脚本',
    setting_resetHint: '这会删除所有设置，相当于重新安装脚本，确定要重置吗？',
    // 搜索时过滤值太高
    sort_noWork: '没有可以显示的作品',
};
// translate by google
Texts[Lang.en_US] = {
    install_title: 'Welcome to PixivPreviewer v',
    install_body: '<div style="position: absolute;width: 40%;left: 30%;top: 30%;font-size: 20px; color: white;"><p style="text-indent: 2em;">Language update(v3.0.15): If your Pixiv\'s language is not Simplified Chinese or Traditional Chinese, script will display in English now.</p><br><p style="text-indent: 2em;"> v3.0.x is a version with a lot of changes to v2.08, so it may be unstable. If you find a problem, please go to<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer/feedback" target="_blank"> Feedback Page </a>to feedback, I will fix it as soon as possible, and suggestions are welcome, thank you very much!</p><p style="text-indent: 2em;">The sorting function will be slower than the previous version. The specific time depends on the loading speed of Pixiv, because the new search page will no longer display the amount of favorites necessary for sorting.</p><br><p style="text-indent: 2em;">If you are using it for the first time, it is recommended to go to the<a style="color: green;" href="https://greasyfork.org/zh-CN/scripts/30766-pixiv-previewer" target="_blank"> Details Page </a>to see the script introduction.</p></div>',
    setting_preview: 'Preview',
    setting_sort: 'Sorting (Search page)',
    setting_anime: 'Animation download (Preview and Artwork page)',
    setting_origin: 'Display original image when preview (slow)',
    setting_maxPage: 'Maximum number of pages counted per sort',
    setting_hideWork: 'Hide works with less than set value',
    setting_hideFav: 'Hide favorites when sorting',
    setting_blank: 'Open works\' details page in new tab',
    setting_turnPage: 'Use ← → to turn pages (Search page)',
    setting_save: 'Save',
    setting_reset: 'Reset',
    setting_resetHint: 'This will delete all settings and set it to default. Are you sure?',
    sort_noWork: 'No works to display',
};

var LogLevel = {
    None: 0,
    Error: 1,
    Warning: 2,
    Info: 3,
    Elements: 4,
};
function DoLog(level, msgOrElement) {
    if (level <= g_logLevel) {
        var prefix = '%c';
        var param = '';

        if (level == LogLevel.Error) {
            prefix += '[Error]';
            param = 'color:#ff0000';
        } else if (level == LogLevel.Warning) {
            prefix += '[Warning]';
            param = 'color:#ffa500';
        } else if (level == LogLevel.Info) {
            prefix += '[Info]';
            param = 'color:#000000';
        } else if (level == LogLevel.Elements) {
            prefix += 'Elements';
            param = 'color:#000000';
        }

        if (level != LogLevel.Elements) {
            console.log(prefix + msgOrElement, param);
        } else {
            console.log(msgOrElement);
        }

        if (++g_logCount > 512) {
            //console.clear();
            g_logCount = 0;
        }
    }
}

// 语言，如果 g_autoDetectLanguage 的值为 true，则默认值无效；如果希望使用某种语言，请这样操作：
// 1.修改 g_language 的值，中文（Lang.zh_CN）、英文（Lang.en_US）
// 2.将 g_autoDetectLanguage 的值从 true 修改为 false
// =====
// If you want to set language instead auto detect it, follow this:
// 1.Change g_language's value, Chinese(Lang.zh_CN), English(Lang.en_US).
// 2.Change g_autoDetectLanguage's value from true to false.
var g_language = Lang.zh_CN;
// 自动检测语言，开启后 g_language 的默认值将无效
var g_autoDetectLanguage = true;
// 版本号，第三位不需要跟脚本的版本号对上，第三位更新只有需要弹更新提示的时候才需要更新这里
var g_version = '3.0.16';
// 添加收藏需要这个
var g_csrfToken = '';
// 打的日志数量，超过一定数值清空控制台
var g_logCount = 0;
// 当前页面类型
var g_pageType = -1;
// 图片详情页的链接，使用时替换 #id#
var g_artworkUrl = '/artworks/#id#';
// 获取图片链接的链接
var g_getArtworkUrl = '/ajax/illust/#id#/pages';
// 获取动图下载链接的链接
var g_getUgoiraUrl = '/ajax/illust/#id#/ugoira_meta';
// 鼠标位置
var g_mousePos = { x: 0, y: 0 };
// 加载中图片
var g_loadingImage = 'https://pp-1252089172.cos.ap-chengdu.myqcloud.com/loading.gif';
// 页面打开时的 url
var initialUrl = location.href;
// 默认设置，仅用于首次脚本初始化
var g_defaultSettings = {
    'enablePreview': 1,
    'enableSort': 1,
    'enableAnimeDownload': 1,
    'original': 0,
    'pageCount': 2,
    'favFilter': 0,
    'hideFavorite': 0,
    'linkBlank': 1,
    'pageByKey': 0,
    'logLevel': 1,
    'version': g_version,
};
// 设置
var g_settings;
// 日志等级
var g_logLevel = LogLevel.Warning;
// 排序时同时请求收藏量的 Request 数量，没必要太多，并不会加快速度
var g_maxXhr = 64;
// 排序是否隐藏已关注画师的作品，如果希望隐藏，将 "false" 修改为 "true" 即可
var g_enableFilterByUser = false;

// 页面相关的一些预定义，包括处理页面元素等
var PageType = {
    // 搜索
    Search: 0,
    // 关注的新作品
    BookMarkNew: 1,
    // 发现
    Discovery: 2,
    // 用户主页
    Member: 3,
    // 首页
    Home: 4,
    // 排行榜
    Ranking: 5,
    // 大家的新作品
    NewIllust: 6,
    // R18
    R18: 7,
    // 自己的收藏页
    BookMark: 8,
    // 动态
    Stacc: 9,
    // 作品详情页（处理动图预览及下载）
    Artwork: 10,

    // 总数
    PageTypeCount: 11,
};
var Pages = {};
/* Pages 必须实现的函数
 * PageTypeString: string，字符串形式的 PageType
 * bool CheckUrl: function(string url)，用于检查一个 url 是否是当前页面的目标 url
 * ReturnMap ProcessPageElements: function()，处理页面（寻找图片元素、添加属性等），返回 ReturnMap
 * ReturnMap GetProcessedPageElements: function(), 返回上一次 ProcessPageElements 的返回值（如果没有上次调用则调用一次）
 * Object GetToolBar: function(), 返回工具栏元素（右下角那个，用来放设置按钮）
 * HasAutoLoad: bool，表示这个页面是否有自动加载功能
 */
var ReturnMapSample = {
    // 页面是否加载完成，false 意味着后面的成员无效
    loadingComplete: false,
    // 控制元素，每个图片的鼠标响应元素
    controlElements: [],
    // 可有可无，如果为 true，强制重新刷新预览功能
    forceUpdate: false,
};
var ControlElementsAttributesSample = {
    // 图片信息，内容如下：
    // [必需] 图片 id
    illustId: 0,
    // [必需] 图片类型（0：普通图片，2：动图）
    illustType: 0,
    // [必需] 页数
    pageCount: 1,
    // [可选] 标题
    title: '',
    // [可选] 作者 id
    userId: 0,
    // [可选] 作者昵称
    userName: '',
    // [可选] 收藏数
    bookmarkCount: 0,
};

Pages[PageType.Search] = {
    PageTypeString: 'SearchPage',
    CheckUrl: function (url) {
        // 没有 /artworks 的页面不支持
        return /^https?:\/\/www.pixiv.net\/tags\/.*\//.test(url) ||
            /^https?:\/\/www.pixiv.net\/en\/tags\/.*\//.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var sections = $('section');
        DoLog(LogLevel.Info, 'Page has ' + sections.length + ' <section>.');
        DoLog(LogLevel.Elements, sections);
        // 先对 section 进行评分
        var sectionIndex = -1;
        var bestScore = -99;
        sections.each(function (i, e) {
            var section = $(e);
            var score = 0;
            if (section.find('ul').length > 0) {
                var childrenCount = section.children().length;
                if (childrenCount != 2) {
                    DoLog(LogLevel.Warning, '<ul> was found in this <section>, but it has ' + childrenCount + ' children!');
                    score--;
                }
                var ul = section.find('ul');
                if (ul.length > 1) {
                    DoLog(LogLevel.Warning, 'This section has more than one <ul>?');
                    score--;
                }
                if ($(ul.parent().get(0)).css('display') == 'none' || $(ul.get(0)).css('display') == 'none') {
                    DoLog(LogLevel.Info, '<ul> or it\'s parentNode is not visible now, continue waiting.');
                    sectionIndex = -1;
                    bestScore = 999;
                    return false;
                }
                if ($(ul.get(0)).next().length === 0) {
                    DoLog(LogLevel.Info, 'Page selector not exists, continue waiting.');
                    sectionIndex = -1;
                    bestScore = 999;
                    return false;
                }
                var lis = ul.find('li');
                if (lis.length === 0) {
                    DoLog(LogLevel.Info, 'This <ul> has 0 children, will be skipped.');
                    return false;
                }
                if ($(lis.get(0)).find('figure').length > 0) {
                    DoLog(LogLevel.Warning, '<figure> was found in the first <li>, continue waiting.');
                    sectionIndex = -1;
                    bestScore = 999;
                    return false;
                }
                if (lis.length > 4) {
                    score += 5;
                }
                // 正确的会在后面
                if (score >= bestScore) {
                    bestScore = score;
                    sectionIndex = i;
                }
            } else {
                DoLog(LogLevel.Info, 'This section(' + i + ' is not has <ul>, will be skipped.');
            }
        });

        if (sectionIndex == -1) {
            if (bestScore < 100) {
                DoLog(LogLevel.Error, 'No suitable <section>!');
            }
            return returnMap;
        }

        var lis = $(sections[sectionIndex]).find('ul').find('li');
        lis.each(function (i, e) {
            var li = $(e);

            // 只填充必须的几个，其他的目前用不着
            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var img = $(li.find('img').get(0));
            var imageLink = img.parent().parent();
            var additionDiv = img.parent().prev();
            var animationSvg = img.parent().find('svg');
            var pageCountSpan = additionDiv.find('span');

            if (img == null || imageLink == null) {
                DoLog(LogLevel.Warning, 'Can not found img or imageLink, skip this.');
                return;
            }

            var link = imageLink.attr('href');
            if (link == null) {
                DoLog(LogLevel.Warning, 'Invalid href, skip this.');
                return;
            }
            var linkMatched = link.match(/artworks\/(\d+)/);
            var illustId = '';
            if (linkMatched) {
                ctlAttrs.illustId = linkMatched[1];
            } else {
                DoLog(LogLevel.Error, 'Get illustId failed, skip this list item!');
                return;
            }
            if (animationSvg.length > 0) {
                ctlAttrs.illustType = 2;
            }
            if (pageCountSpan.length > 0) {
                ctlAttrs.pageCount = parseInt(pageCountSpan.text());
            }

            // 添加 attr
            var control = li.children('div:first').children('div:first');
            control.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            control.addClass('pp-control');
        });
        returnMap.controlElements = $('.pp-control');
        this.private.pageSelector = $($(sections[sectionIndex]).find('ul').get(0)).next().get(0);
        returnMap.loadingComplete = true;
        this.private.imageListConrainer = $(sections[sectionIndex]).find('ul').get(0);

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        var div = $('#root').children('div');
        for (var i = div.length - 1; i >= 0; i--) {
            if ($(div.get(i)).children('ul').length > 0) {
                return $(div.get(i)).children('ul').get(0);
            }
        }
    },
    // 搜索页有 lazyload，不开排序的情况下，最后几张图片可能会无法预览。这里把它当做自动加载处理
    HasAutoLoad: true,
    GetImageListContainer: function () {
        return this.private.imageListConrainer;
    },
    GetFirstImageElement: function () {
        return $(this.private.imageListConrainer).find('li').get(0);
    },
    GetPageSelector: function () {
        return this.private.pageSelector;
    },
    private: {
        imageListContainer: null,
        pageSelector: null,
        returnMap: null,
    },
};
Pages[PageType.BookMarkNew] = {
    PageTypeString: 'BookMarkNewPage',
    CheckUrl: function (url) {
        return /^https:\/\/www.pixiv.net\/bookmark_new_illust.php.*/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var containerDiv = $('#js-mount-point-latest-following').children('div:first');
        if (containerDiv.length > 0) {
            DoLog(LogLevel.Info, 'Found container div.');
            DoLog(LogLevel.Elements, containerDiv);
        } else {
            DoLog(LogLevel.Error, 'Can not found container div.');
            return returnMap;
        }

        containerDiv.children().each(function (i, e) {
            var _this = $(e);

            var figure = _this.find('figure');
            if (figure.length === 0) {
                DoLog(LogLevel.Warning, 'Can not found <fingure>, skip this element.');
                return;
            }

            var link = figure.children('div:first').children('a:first');
            if (link.length === 0) {
                DoLog(LogLevel.Warning, 'Can not found <a>, skip this element.');
                return;
            }

            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var href = link.attr('href');
            if (href == null || href === '') {
                DoLog(LogLevel.Warning, 'No href found, skip.');
                return;
            } else {
                var matched = href.match(/artworks\/(\d+)/);
                if (matched) {
                    ctlAttrs.illustId = matched[1];
                } else {
                    DoLog(LogLevel.Warning, 'Can not found illust id, skip.');
                    return;
                }
            }

            if (link.children().length > 1) {
                if (link.children('div:first').find('span').length > 0) {
                    var span = link.children('div:first').children('span:first');
                    if (span.length === 0) {
                        DoLog(LogLevel.Warning, 'Can not found <span>, skip this element.');
                        return;
                    }
                    ctlAttrs.pageCount = span.text();
                } else {
                    ctlAttrs.illustType = 2;
                }
            }

            var control = figure.children('div:first');
            control.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            returnMap.controlElements.push(control.get(0));
        });

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        returnMap.loadingComplete = true;
        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        return $('._toolmenu').get(0);
    },
    HasAutoLoad: false,
    private: {
        returnMap: null,
    },
};
Pages[PageType.Discovery] = {
    PageTypeString: 'DiscoveryPage',
    CheckUrl: function (url) {
        return /^https?:\/\/www.pixiv.net\/discovery.*/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var containerDiv = $('.gtm-illust-recommend-zone');
        if (containerDiv.length > 0) {
            DoLog(LogLevel.Info, 'Found container div.');
            DoLog(LogLevel.Elements, containerDiv);
        } else {
            DoLog(LogLevel.Error, 'Can not found container div.');
            return returnMap;
        }

        containerDiv.children().each(function (i, e) {
            var _this = $(e);

            var figure = _this.find('figure');
            if (figure.length === 0) {
                DoLog(LogLevel.Warning, 'Can not found <fingure>, skip this element.');
                return;
            }

            var link = figure.children('div:first').children('a:first');
            if (link.length === 0) {
                DoLog(LogLevel.Warning, 'Can not found <a>, skip this element.');
                return;
            }

            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var href = link.attr('href');
            if (href == null || href === '') {
                DoLog(LogLevel.Warning, 'No href found, skip.');
                return;
            } else {
                var matched = href.match(/artworks\/(\d+)/);
                if (matched) {
                    ctlAttrs.illustId = matched[1];
                } else {
                    DoLog(LogLevel.Warning, 'Can not found illust id, skip.');
                    return;
                }
            }

            if (link.children().length > 1) {
                if (link.children('div:first').find('span').length > 0) {
                    var span = link.children('div:first').children('span:first');
                    if (span.length === 0) {
                        DoLog(LogLevel.Warning, 'Can not found <span>, skip this element.');
                        return;
                    }
                    ctlAttrs.pageCount = span.text();
                } else if (link.children('div:last').css('background-image').indexOf('.svg') != -1) {
                    ctlAttrs.illustType = 2;
                }
            }

            var control = figure.children('div:first');
            control.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            returnMap.controlElements.push(control.get(0));
        });

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        returnMap.loadingComplete = true;
        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        return $('._toolmenu').get(0);
    },
    HasAutoLoad: true,
    private: {
        returnMap: null,
    },
};
Pages[PageType.Member] = {
    PageTypeString: 'MemberPage/MemberIllustPage/MemberBookMark',
    CheckUrl: function (url) {
        return /^https?:\/\/www.pixiv.net\/users\/\d+/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var sections = $('section');
        DoLog(LogLevel.Info, 'Page has ' + sections.length + ' <section>.');
        DoLog(LogLevel.Elements, sections);

        var lis = sections.find('ul').find('li');
        lis.each(function (i, e) {
            var li = $(e);

            // 只填充必须的几个，其他的目前用不着
            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var img = $(li.find('img').get(0));
            var imageLink = img.parent().parent();
            var additionDiv = img.parent().prev();
            var animationSvg = img.parent().find('svg');
            var pageCountSpan = additionDiv.find('span');

            if (!img || !imageLink) {
                DoLog(LogLevel.Warning, 'Can not found img or imageLink, skip this.');
                return;
            }

            var link = imageLink.attr('href');
            if (link == null) {
                DoLog(LogLevel.Warning, 'Can not found illust id, skip this.');
                return;
            }

            var linkMatched = link.match(/artworks\/(\d+)/);
            var illustId = '';
            if (linkMatched) {
                ctlAttrs.illustId = linkMatched[1];
            } else {
                DoLog(LogLevel.Error, 'Get illustId failed, skip this list item!');
                return;
            }
            if (animationSvg.length > 0) {
                ctlAttrs.illustType = 2;
            }
            if (pageCountSpan.length > 0) {
                ctlAttrs.pageCount = parseInt(pageCountSpan.text());
            }

            // 添加 attr
            var control = li.children('div:first').children('div:first');
            if (control.length === 0) {
                control = li.children('div:last').children('div:first');
            }
            control.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            control.addClass('pp-control');
        });
        returnMap.controlElements = $('.pp-control');
        returnMap.loadingComplete = true;

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        var div = $('#root').children('div');
        for (var i = div.length - 1; i >= 0; i--) {
            if ($(div.get(i)).children('ul').length > 0) {
                return $(div.get(i)).children('ul').get(0);
            }
        }
    },
    // 跟搜索页一样的情况
    HasAutoLoad: true,
    private: {
        returnMap: null,
    },
};
Pages[PageType.Home] = {
    PageTypeString: 'HomePage',
    CheckUrl: function (url) {
        return /https?:\/\/www.pixiv.net\/?$/.test(url) ||
            /https?:\/\/www.pixiv.net\/en\/?$/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
            forceUpdate: false,
        };

        var illust_div = $('div[type="illust"]');

        DoLog(LogLevel.Info, 'This page has ' + illust_div.length + ' illust <div>.');
        if (illust_div.length < 1) {
            DoLog(LogLevel.Warning, 'Less than one <div>, continue waiting.');
            return returnMap;
        }

        // 实际里面还套了一个 div，处理一下，方便一点
        let illust_div_c = [];
        illust_div.each(function(i, e) {
            illust_div_c.push($(e).children('div:first'));
        });
        illust_div = illust_div_c;
        $.each(illust_div, function (i, e) {
            var _this = $(e);

            var a = _this.children('a:first');
            if (a.length == 0 || a.attr('href').indexOf('artworks') == -1) {
                DoLog(LogLevel.Warning, 'No href or an invalid href was found, skip this.');
                return;
            }

            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var illustId = a.attr('href').match(/\d+/);
            if (illustId == null) {
                DoLog(LogLevel.Warning, 'Can not found illust id of this image, skip.');
                return;
            } else {
                ctlAttrs.illustId = illustId[0];
            }
            var pageCount = a.children('div:first').find('span');
            if (pageCount.length > 0) {
                ctlAttrs.pageCount = parseInt($(pageCount.get(pageCount.length - 1)).text());
            }
            if ($(a.children('div').get(1)).find('svg').length > 0) {
                ctlAttrs.illustType = 2;
            }

            var control = a;
            if (control.attr('illustId') != ctlAttrs.illustId) {
                returnMap.forceUpdate = true;
            }
            control.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            returnMap.controlElements.push(control.get(0));
        });

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        returnMap.loadingComplete = true;
        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        let div = $('#root').children('div');
        for (let i = div.length - 1; i >= 0; i--) {
            if ($(div.get(i)).children('ul').length > 0) {
                return $(div.get(i)).children('ul').get(0);
            }
        }
    },
    HasAutoLoad: true,
    private: {
        returnMap: null,
    },
};
Pages[PageType.Ranking] = {
    PageTypeString: 'RankingPage',
    CheckUrl: function (url) {
        return /^https?:\/\/www.pixiv.net\/ranking.php.*/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var works = $('._work');

        DoLog(LogLevel.Info, 'Found .work, length: ' + works.length);
        DoLog(LogLevel.Elements, works);

        works.each(function (i, e) {
            var _this = $(e);

            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var href = _this.attr('href');

            if (href == null || href === '') {
                DoLog('Can not found illust id, skip this.');
                return;
            }

            var matched = href.match(/artworks\/(\d+)/);
            if (matched) {
                ctlAttrs.illustId = matched[1];
            } else {
                DoLog('Can not found illust id, skip this.');
                return;
            }

            if (_this.hasClass('multiple')) {
                ctlAttrs.pageCount = _this.find('.page-count').find('span').text();
            }

            if (_this.hasClass('ugoku-illust')) {
                ctlAttrs.illustType = 2;
            }

            // 添加 attr
            _this.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            returnMap.controlElements.push(e);
        });

        returnMap.loadingComplete = true;

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        return $('._toolmenu').get(0);
    },
    HasAutoLoad: false,
    private: {
        returnMap: null,
    },
};
Pages[PageType.NewIllust] = {
    PageTypeString: 'NewIllustPage',
    CheckUrl: function (url) {
        return /^https?:\/\/www.pixiv.net\/new_illust.php.*/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var ul = $('#root').find('ul:first');
        if (ul.length === 0) {
            DoLog(LogLevel.Error, 'Can not found <ul>!');
            return returnMap;
        }

        ul.find('li').each(function (i, e) {
            var _this = $(e);

            var link = _this.find('a:first');
            var href = link.attr('href');
            if (href == null || href === '') {
                DoLog(LogLevel.Error, 'Can not found illust id, skip this.');
                return;
            }

            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var matched = href.match(/artworks\/(\d+)/);
            if (matched) {
                ctlAttrs.illustId = matched[1];
            } else {
                DoLog(LogLevel.Warning, 'Can not found illust id, skip this.');
                return;
            }

            if (link.children().length > 1) {
                var span = link.find('svg').parent().parent().next();
                if (span.length > 0 && span.get(0).tagName == 'SPAN') {
                    ctlAttrs.pageCount = span.text();
                } else if (link.find('svg').length > 0) {
                    ctlAttrs.illustType = 2;
                }
            }

            var control = _this.children('div:first').children('div:first');
            control.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            returnMap.controlElements.push(control.get(0));
        });

        returnMap.loadingComplete = true;

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        var div = $('#root').children('div');
        for (var i = div.length - 1; i >= 0; i--) {
            if ($(div.get(i)).children('ul').length > 0) {
                return $(div.get(i)).children('ul').get(0);
            }
        }
    },
    HasAutoLoad: true,
    private: {
        returnMap: null,
    },
};
Pages[PageType.R18] = {
    PageTypeString: 'R18Page',
    CheckUrl: function (url) {
        return /^https?:\/\/www.pixiv.net\/cate_r18.php.*/.test(url);
    },
    ProcessPageElements: function () {
        //
    },
    GetToolBar: function () {
        //
    },
    HasAutoLoad: false,
};
Pages[PageType.BookMark] = {
    PageTypeString: 'BookMarkPage',
    CheckUrl: function (url) {
        return /^https:\/\/www.pixiv.net\/bookmark.php\/?$/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var images = $('.image-item');
        DoLog(LogLevel.Info, 'Found images, length: ' + images.length);
        DoLog(LogLevel.Elements, images);

        images.each(function (i, e) {
            var _this = $(e);

            var work = _this.find('._work');
            if (work.length === 0) {
                DoLog(LogLevel.Warning, 'Can not found ._work, skip this.');
                return;
            }

            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var href = work.attr('href');
            if (href == null || href === '') {
                DoLog(LogLevel.Warning, 'Can not found illust id, skip this.');
                return;
            }

            var matched = href.match(/artworks\/(\d+)/);
            if (matched) {
                ctlAttrs.illustId = matched[1];
            } else {
                DoLog(LogLevel.Warning, 'Can not found illust id, skip this.');
                return;
            }

            if (work.hasClass('multiple')) {
                ctlAttrs.pageCount = _this.find('.page-count').find('span').text();
            }

            if (work.hasClass('ugoku-illust')) {
                ctlAttrs.illustType = 2;
            }

            // 添加 attr
            var control = _this.children('a:first');
            control.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            returnMap.controlElements.push(control.get(0));
        });

        returnMap.loadingComplete = true;

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        return $('._toolmenu').get(0);
    },
    HasAutoLoad: false,
    private: {
        returnMap: null,
    },
};
Pages[PageType.Stacc] = {
    PageTypeString: 'StaccPage',
    CheckUrl: function (url) {
        return /^https:\/\/www.pixiv.net\/stacc.*/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        var works = $('._work');

        DoLog(LogLevel.Info, 'Found .work, length: ' + works.length);
        DoLog(LogLevel.Elements, works);

        works.each(function (i, e) {
            var _this = $(e);

            var ctlAttrs = {
                illustId: 0,
                illustType: 0,
                pageCount: 1,
            };

            var href = _this.attr('href');

            if (href == null || href === '') {
                DoLog('Can not found illust id, skip this.');
                return;
            }

            var matched = href.match(/illust_id=(\d+)/);
            if (matched) {
                ctlAttrs.illustId = matched[1];
            } else {
                DoLog('Can not found illust id, skip this.');
                return;
            }

            if (_this.hasClass('multiple')) {
                ctlAttrs.pageCount = _this.find('.page-count').find('span').text();
            }

            if (_this.hasClass('ugoku-illust')) {
                ctlAttrs.illustType = 2;
            }

            // 添加 attr
            _this.attr({
                'illustId': ctlAttrs.illustId,
                'illustType': ctlAttrs.illustType,
                'pageCount': ctlAttrs.pageCount
            });

            returnMap.controlElements.push(e);
        });

        returnMap.loadingComplete = true;

        DoLog(LogLevel.Info, 'Process page elements complete.');
        DoLog(LogLevel.Elements, returnMap);

        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        return $('._toolmenu').get(0);
    },
    HasAutoLoad: true,
    private: {
        returnMap: null,
    },
};
Pages[PageType.Artwork] = {
    PageTypeString: 'ArtworkPage',
    CheckUrl: function (url) {
        return /^https:\/\/www.pixiv.net\/artworks\/.*/.test(url) ||
            /^https:\/\/www.pixiv.net\/en\/artworks\/.*/.test(url);
    },
    ProcessPageElements: function () {
        var returnMap = {
            loadingComplete: false,
            controlElements: [],
        };

        // 是动图
        var canvas = $('main').find('figure').find('canvas');
        if ($('main').find('figure').find('canvas').length > 0) {
            this.private.needProcess = true;
            canvas.addClass('pp-canvas');
        }

        if (location.href.indexOf('#preview') == -1) {
            // 相关作品
            var containerDiv = $('.gtm-illust-recommend-zone');
            if (containerDiv.length > 0) {
                DoLog(LogLevel.Info, 'Found container div.');
                DoLog(LogLevel.Elements, containerDiv);
            } else {
                DoLog(LogLevel.Error, 'Can not found container div.');
                return returnMap;
            }

            containerDiv.children().each(function (i, e) {
                var _this = $(e);

                var img = _this.find('img');
                if (img.length === 0) {
                    DoLog(LogLevel.Warning, 'Can not found <img>, skip this element.');
                    return;
                }

                var link = _this.find('a:first');
                if (link.length === 0) {
                    DoLog(LogLevel.Warning, 'Can not found <a>, skip this element.');
                    return;
                }

                var ctlAttrs = {
                    illustId: 0,
                    illustType: 0,
                    pageCount: 1,
                };

                var href = link.attr('href');
                if (href == null || href === '') {
                    DoLog(LogLevel.Warning, 'No href found, skip.');
                    return;
                } else {
                    var matched = href.match(/artworks\/(\d+)/);
                    if (matched) {
                        ctlAttrs.illustId = matched[1];
                    } else {
                        DoLog(LogLevel.Warning, 'Can not found illust id, skip.');
                        return;
                    }
                }

                if (link.children().length > 1) {
                    if (link.children('div:first').find('span').length > 0) {
                        var span = link.children('div:first').find('span:first');
                        if (span.length === 0) {
                            DoLog(LogLevel.Warning, 'Can not found <span>, skip this element.');
                            return;
                        }
                        ctlAttrs.pageCount = span.next().text();
                    } else if (link.children('div:last').find('svg').length > 0) {
                        ctlAttrs.illustType = 2;
                    }
                }

                var control = link.parent();
                control.attr({
                    'illustId': ctlAttrs.illustId,
                    'illustType': ctlAttrs.illustType,
                    'pageCount': ctlAttrs.pageCount
                });

                returnMap.controlElements.push(control.get(0));
            });

            DoLog(LogLevel.Info, 'Process page elements complete.');
            DoLog(LogLevel.Elements, returnMap);
        }

        returnMap.loadingComplete = true;
        this.private.returnMap = returnMap;
        return returnMap;
    },
    GetProcessedPageElements: function () {
        if (this.private.returnMap == null) {
            return this.ProcessPageElements();
        }
        return this.private.returnMap;
    },
    GetToolBar: function () {
        var div = $('#root').children('div');
        for (var i = div.length - 1; i >= 0; i--) {
            if ($(div.get(i)).children('ul').length > 0) {
                return $(div.get(i)).children('ul').get(0);
            }
        }
    },
    HasAutoLoad: true,
    Work: function () {
        function AddDownloadButton(div, button, offsetToOffsetTop) {
            if (!g_settings.enableAnimeDownload) {
                return;
            }

            var cloneButton = button.clone().css({ 'bottom': '50px', 'margin': 0, 'padding': 0, 'width': '48px', 'height': '48px', 'opacity': '0.4', 'cursor': 'pointer' });
            cloneButton.get(0).innerHTML = '<svg viewBox="0 0 120 120" style="width: 40px; height: 40px; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; border-radius: 24px; background-color: black; stroke: limegreen; fill: none;" class="_3Fo0Hjg"><polyline points="60,30 60,90"></polyline><polyline points="30,60 60,90 90,60"></polyline></svg></button>';

            function MoveButton() {
                function getOffset(e) {
                    if (e.offsetParent) {
                        var offset = getOffset(e.offsetParent);
                        return {
                            offsetTop: e.offsetTop + offset.offsetTop,
                            offsetLeft: e.offsetLeft + offset.offsetLeft,
                        };
                    } else {
                        return {
                            offsetTop: e.offsetTop,
                            offsetLeft: e.offsetLeft,
                        };
                    }
                }

                var offset = getOffset(button.get(0));
                DoLog(LogLevel.Info, 'offset of download button: ' + offset.offsetTop + ', ' + offset.offsetLeft);
                DoLog(LogLevel.Elements, offset);

                cloneButton.css({ 'position': 'absolute', 'left': offset.offsetLeft, 'top': offset.offsetTop - 50 - offsetToOffsetTop }).show();
            }

            MoveButton();
            $(window).on('resize', MoveButton);
            div.append(cloneButton);

            cloneButton.mouseover(function () {
                $(this).css('opacity', '0.2');
            }).mouseleave(function () {
                $(this).css('opacity', '0.4');
            }).click(function () {
                var illustId = '';

                var matched = location.href.match(/artworks\/(\d+)/);
                if (matched) {
                    illustId = matched[1];
                    DoLog(LogLevel.Info, 'IllustId=' + illustId);
                } else {
                    DoLog(LogLevel.Error, 'Can not found illust id!');
                    return;
                }

                $.ajax(g_getUgoiraUrl.replace('#id#', illustId), {
                    method: 'GET',
                    success: function (json) {
                        DoLog(LogLevel.Elements, json);

                        if (json.error == true) {
                            DoLog(LogLevel.Error, 'Server response an error: ' + json.message);
                            return;
                        }

                        // 因为浏览器会拦截不同域的 open 操作，绕一下
                        var newWindow = window.open('_blank');
                        newWindow.location = json.body.originalSrc;
                    },
                    error: function () {
                        DoLog(LogLevel.Error, 'Request zip file failed!');
                    }
                });
            });
        }

        if (this.private.needProcess) {
            var canvas = $('.pp-canvas');

            // 预览模式，需要调成全屏，并且添加下载按钮到全屏播放的 div 里
            if (location.href.indexOf('#preview') != -1) {
                canvas.click();

                $('#root').remove();

                var callbackInterval = setInterval(function () {
                    var div = $('div[role="presentation"]');
                    if (div.length < 1) {
                        return;
                    }

                    DoLog(LogLevel.Info, 'found <div>, continue to next step.');

                    clearInterval(callbackInterval);

                    var presentationCanvas = div.find('canvas');
                    if (presentationCanvas.length < 1) {
                        DoLog(LogLevel.Error, 'Can not found canvas in the presentation div.');
                        return;
                    }

                    var width = 0, height = 0;
                    var tWidth = presentationCanvas.attr('width');
                    var tHeight = presentationCanvas.attr('height');
                    if (tWidth && tHeight) {
                        width = parseInt(tWidth);
                        height = parseInt(tHeight);
                    } else {
                        tWidth = presentationCanvas.css('width');
                        tHeight = presentationCanvas.css('height');
                        width = parseInt(tWidth);
                        height = parseInt(this);
                    }

                    var parent = presentationCanvas.parent();
                    for (var i = 0; i < 3; i++) {
                        parent.get(0).className = '';
                        parent = parent.parent();
                    }
                    presentationCanvas.css({ 'width': width + 'px', 'height': height + 'px', 'cursor': 'default' }).addClass('pp-presentationCanvas');
                    var divForStopClick = $('<div class="pp-disableClick"></div>').css({
                        'width': width + 'px', 'height': height + 'px',
                        'opacity': 0,
                        'position': 'absolute', 'top': '0px', 'left': '0px', 'z-index': 99999,
                    });
                    div.append(divForStopClick);
                    div.append(presentationCanvas.next().css('z-index', 99999));
                    presentationCanvas.next().remove();
                    // 防止预览图消失
                    $('html').addClass('pp-main');

                    // 调整 canvas 大小的函数
                    window.ResizeCanvas = function (newWidth, newHeight) {
                        DoLog(LogLevel.Info, 'Resize canvas: ' + newWidth + 'x' + newHeight);
                        $('.pp-disableClick').css({ 'width': newWidth, 'height': newHeight });
                        $('.pp-presentationCanvas').css({ 'width': newWidth, 'height': newHeight });
                    };
                    window.GetCanvasSize = function () {
                        return {
                            width: width,
                            height: height,
                        };
                    }

                    // 添加下载按钮
                    AddDownloadButton(div, divForStopClick.next(), 0);

                    window.parent.PreviewCallback(width, height);
                }, 500);
            }
            // 普通模式，只需要添加下载按钮到内嵌模式的 div 里
            else {
                var div = $('div[role="presentation"]');
                var button = div.find('button');

                var headerRealHeight = parseInt($('header').css('height')) +
                    parseInt($('header').css('padding-top')) + parseInt($('header').css('padding-bottom')) +
                    parseInt($('header').css('margin-top')) + parseInt($('header').css('margin-bottom')) +
                    parseInt($('header').css('border-bottom-width')) + parseInt($('header').css('border-top-width'));

                AddDownloadButton(div, button, headerRealHeight);
            }
        }
    },
    private: {
        needProcess: false,
        returnMap: null,
    },
};

function CheckUrlTest() {
    var urls = [
        'http://www.pixiv.net',
        'http://www.pixiv.net',
        'https://www.pixiv.net',
        'https://www.pixiv.net/',
        'https://www.pixiv.net/?lang=en',
        'https://www.pixiv.net/search.php?s_mode=s_tag&word=miku',
        'https://www.pixiv.net/search.php?word=VOCALOID&s_mode=s_tag_full',
        'https://www.pixiv.net/discovery',
        'https://www.pixiv.net/discovery?x=1',
        'https://www.pixiv.net/member.php?id=3207350',
        'https://www.pixiv.net/member_illust.php?id=3207350&type=illust',
        'https://www.pixiv.net/bookmark.php?id=3207350&rest=show',
        'https://www.pixiv.net/ranking.php?mode=daily&content=ugoira',
        'https://www.pixiv.net/ranking.php?mode=daily',
        'https://www.pixiv.net/new_illust.php',
        'https://www.pixiv.net/new_illust.php?x=1',
        'https://www.pixiv.net/cate_r18.php',
        'https://www.pixiv.net/cate_r18.php?x=1',
        'https://www.pixiv.net/bookmark.php',
        'https://www.pixiv.net/bookmark.php?x=1',
        'https://www.pixiv.net/stacc?mode=unify',
        'https://www.pixiv.net/artworks/77996773',
        'https://www.pixiv.net/artworks/77996773#preview',
    ];

    for (var j = 0; j < urls.length; j++) {
        for (var i = 0; i < PageType.PageTypeCount; i++) {
            if (Pages[i].CheckUrl(urls[j])) {
                console.log(urls[j]);
                console.log('[' + j + '] is ' + Pages[i].PageTypeString);
            }
        }
    }
}

/* ---------------------------------------- 预览 ---------------------------------------- */
let autoLoadInterval = null;
function PixivPreview() {
    // 开启预览功能
    function ActivePreview() {
        var returnMap = Pages[g_pageType].GetProcessedPageElements();
        if (!returnMap.loadingComplete) {
            DoLog(LogLevel.Error, 'Page not load, should not call Preview!');
            return;
        }

        // 鼠标进入
        $(returnMap.controlElements).mouseenter(function (e) {
            // 按住 Ctrl键 不显示预览图
            if (e.ctrlKey) {
                return;
            }

            var _this = $(this);
            var illustId = _this.attr('illustId');
            var illustType = _this.attr('illustType');
            var pageCount = _this.attr('pageCount');

            if (illustId == null) {
                DoLog(LogLevel.Error, 'Can not found illustId in this element\'s attrbutes.');
                return;
            }
            if (illustType == null) {
                DoLog(LogLevel.Error, 'Can not found illustType in this element\'s attrbutes.');
                return;
            }
            if (pageCount == null) {
                DoLog(LogLevel.Error, 'Can not found pageCount in this element\'s attrbutes.');
                return;
            }

            // 鼠标位置
            g_mousePos = { x: e.pageX, y: e.pageY };
            // 预览 Div
            var previewDiv = $(document.createElement('div')).addClass('pp-main').attr('illustId', illustId)
            .css({
                'position': 'absolute', 'z-index': '999999', 'left': g_mousePos.x + 'px', 'top': g_mousePos.y + 'px',
                'border-style': 'solid', 'border-color': '#6495ed', 'border-width': '2px', 'border-radius': '20px',
                'width': '48px', 'height': '48px',
                'background-image': 'url(https://pp-1252089172.cos.ap-chengdu.myqcloud.com/transparent.png)',
            });
            // 添加到 body
            $('.pp-main').remove();
            $('body').append(previewDiv);

            // 加载中图片
            var loadingImg = $(new Image()).addClass('pp-loading').attr('src', g_loadingImage).css({
                'position': 'absolute', 'border-radius': '20px',
            });
            previewDiv.append(loadingImg);

            // 要显示的预览图节点
            var loadImg = $(new Image()).addClass('pp-image').css({ 'height': '0px', 'width': '0px', 'display': 'none', 'border-radius': '20px' });
            previewDiv.append(loadImg);

            // 原图（笑脸）图标
            var originIcon = $(new Image()).addClass('pp-original').attr('src', 'https://source.pixiv.net/www/images/pixivcomic-favorite.png')
            .css({ 'position': 'absolute', 'bottom': '5px', 'right': '5px', 'display': 'none' });
            previewDiv.append(originIcon);

            // 点击图标新网页打开原图
            originIcon.click(function () {
                window.open($(previewDiv).children('img')[1].src);
            });

            // 右上角张数标记
            var pageCountHTML = '<div class="pp-pageCount" style="display: flex;-webkit-box-align: center;align-items: center;box-sizing: border-box;margin-left: auto;height: 20px;color: rgb(255, 255, 255);font-size: 10px;line-height: 12px;font-weight: bold;flex: 0 0 auto;padding: 4px 6px;background: rgba(0, 0, 0, 0.32);border-radius: 10px;margin-top:5px;margin-right:5px;">\<svg viewBox="0 0 9 10" width="9" height="10" style="stroke: none;line-height: 0;font-size: 0px;fill: currentcolor;"><path d="M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"></path></svg><span style="margin-left:2px;" class="pp-page">0/0</span></div>';
            var pageCountDiv = $(pageCountHTML)
            .css({ 'position': 'absolute', 'top': '0px', 'display': 'none', 'right': '0px', 'display': 'none' });
            previewDiv.append(pageCountDiv);

            $('.pp-main').mouseleave(function (e) {
                $(this).remove();
            });

            var url = '';
            if (illustType == 2) {
                // 动图
                var screenWidth = document.documentElement.clientWidth;
                var screenHeight = document.documentElement.clientHeight;
                previewDiv.get(0).innerHTML = '<iframe class="pp-iframe" style="width: 48px; height: 48px; display: none; border-radius: 20px;" src="https://www.pixiv.net/artworks/' + illustId + '#preview" />';
                previewDiv.append(loadingImg);
            } else {
                url = g_getArtworkUrl.replace('#id#', illustId);

                // 获取图片链接
                $.ajax(url, {
                    method: 'GET',
                    success: function (json) {
                        DoLog(LogLevel.Info, 'Got artwork urls:');
                        DoLog(LogLevel.Elements, json);

                        if (json.error === true) {
                            DoLog(LogLevel.Error, 'Server responsed an error: ' + json.message);
                            return;
                        }

                        var regular = [];
                        var original = [];
                        for (var i = 0; i < json.body.length; i++) {
                            regular.push(json.body[i].urls.regular);
                            original.push(json.body[i].urls.original);
                        }

                        DoLog(LogLevel.Info, 'Process urls complete.');
                        DoLog(LogLevel.Elements, regular);
                        DoLog(LogLevel.Elements, original);

                        ViewImages(regular, 0, original, g_settings.original);
                    },
                    error: function (data) {
                        DoLog(LogLevel.Error, 'Request image urls failed!');
                        if (data) {
                            DoLog(LogLevel.Elements, data);
                        }
                    }
                });
            }
        });

        // 鼠标移出图片
        $(returnMap.controlElements).mouseleave(function (e) {
            var _this = $(this);
            var illustId = _this.attr('illustId');
            var illustType = _this.attr('illustType');
            var pageCount = _this.attr('pageCount');

            var moveToElement = $(e.relatedTarget);
            var isMoveToPreviewElement = false;
            // 鼠标移动到预览图上
            while (true) {
                if (moveToElement.hasClass('pp-main') && moveToElement.attr('illustId') == illustId) {
                    isMoveToPreviewElement = true;
                }

                if (moveToElement.parent().length < 1) {
                    break;
                }

                moveToElement = moveToElement.parent();
            }
            if (!isMoveToPreviewElement) {
                // 非预览图上
                $('.pp-main').remove();
            }
        });

        // 鼠标移动，调整位置
        $(returnMap.controlElements).mousemove(function (e) {
            // Ctrl 和 中键 都可以禁止预览图移动，这样就可以单手操作了
            if (e.ctrlKey || e.buttons & 4) {
                return;
            }
            var screenWidth = document.documentElement.clientWidth;
            var screenHeight = document.documentElement.clientHeight;
            g_mousePos.x = e.pageX; g_mousePos.y = e.pageY;

            AdjustDivPosition();
        });

        // 这个页面有自动加载
        if (Pages[g_pageType].HasAutoLoad && autoLoadInterval == null) {
            autoLoadInterval = setInterval(ProcessAutoLoad, 1000);
            DoLog(LogLevel.Info, 'Auto load interval set.');
        }

        // 插一段回调函数
        window.PreviewCallback = PreviewCallback;
        DoLog(LogLevel.Info, 'Callback function was inserted.');
        DoLog(LogLevel.Elements, window.PreviewCallback);

        DoLog(LogLevel.Info, 'Preview enable succeed!');
    }

    // 关闭预览功能，不是给外部用的
    function DeactivePreview() {
        var returnMap = Pages[g_pageType].GetProcessedPageElements();
        if (!returnMap.loadingComplete) {
            DoLog(LogLevel.Error, 'Page not load, should not call Preview!');
            return;
        }

        // 只需要取消绑定事件， attrs 以及回调都不需要删除
        $(returnMap.controlElements).unbind('mouseenter').unbind('mouseleave').unbind('mousemove');

        if (autoLoadInterval) {
            clearInterval(autoLoadInterval);
            autoLoadInterval = null;
        }

        DoLog(LogLevel.Info, 'Preview disable succeed!');
    }

    // iframe 的回调函数
    function PreviewCallback(canvasWidth, canvasHeight) {
        DoLog(LogLevel.Info, 'iframe callback, width: ' + canvasWidth + ', height: ' + canvasHeight);

        var size = AdjustDivPosition();

        $('.pp-loading').hide();
        $('.pp-iframe').css({ 'width': size.width, 'height': size.height }).show();
    }

    // 调整预览 Div 的位置
    function AdjustDivPosition() {
        // 鼠标到预览图的距离
        var fromMouseToDiv = 30;

        var screenWidth = document.documentElement.clientWidth;
        var screenHeight = document.documentElement.clientHeight;
        var left = 0;
        var top = document.body.scrollTop + document.documentElement.scrollTop;

        var width = 0, height = 0;
        if ($('.pp-main').find('iframe').length > 0) {
            var iframe = $('.pp-main').find('iframe').get(0);
            if (iframe.contentWindow.GetCanvasSize) {
                var canvasSize = iframe.contentWindow.GetCanvasSize();
                width = canvasSize.width;
                height = canvasSize.height;
            } else {
                width = 0;
                height = 0;
            }
        } else {
            $('.pp-image').css({ 'width': '', 'height': '' });
            width = $('.pp-image').get(0) == null ? 0 : $('.pp-image').get(0).width;
            height = $('.pp-image').get(0) == null ? 0 : $('.pp-image').get(0).height;
        }

        var isShowOnLeft = g_mousePos.x > screenWidth / 2;

        var newWidth = 48, newHeight = 48;
        if (width > 0 && height > 0) {
            newWidth = isShowOnLeft ? g_mousePos.x - fromMouseToDiv : screenWidth - g_mousePos.x - fromMouseToDiv;
            newHeight = height / width * newWidth;
            // 高度不足以完整显示，只能让两侧留空了
            if (newHeight > screenHeight) {
                newHeight = screenHeight;
                newWidth = newHeight / height * width;
            }
            newWidth -= 5;
            newHeight -= 5;

            // 设置新的宽高
            if ($('.pp-main').find('iframe').length > 0) {
                var iframe = $('.pp-main').find('iframe');
                iframe.get(0).contentWindow.ResizeCanvas(newWidth, newHeight);
                iframe.css({ 'width': newWidth, 'height': newHeight });
            }
            else {
                $('.pp-image').css({ 'height': newHeight + 'px', 'width': newWidth + 'px' });
            }

            // 调整下一次 loading 出现的位置
            $('.pp-loading').css({ 'left': newWidth / 2 - 24 + 'px', 'top': newHeight / 2 - 24 + 'px' });
        }

        // 图片宽度大于高度很多时，会显示在页面顶部，鼠标碰不到，把它移动到下面
        if (top + newHeight <= g_mousePos.y) {
            top = (g_mousePos.y - newHeight - fromMouseToDiv);
        }
        // 调整DIV的位置
        left = isShowOnLeft ? g_mousePos.x - newWidth - fromMouseToDiv : g_mousePos.x + fromMouseToDiv;

        $('.pp-main').css({ 'left': left + 'px', 'top': top + 'px', 'width': newWidth, 'height': newHeight });

        // 返回新的宽高
        return {
            width: newWidth,
            height: newHeight,
        };
    }

    // 显示预览图
    function ViewImages(regular, index, original, isShowOriginal) {
        if (!regular || regular.length === 0) {
            DoLog(LogLevel.Error, 'Regular url array is null, can not view images!');
            return;
        }
        if (index == null || index < 0 || index >= regular.length) {
            DoLog(LogLevel.Error, 'Index(' + index + ') out of range, can not view images!');
            return;
        }
        if (original == null || original.length === 0) {
            DoLog(LogLevel.Warning, 'Original array is null, replace it with regular array.');
            original = regular;
        }
        if (original.length < regular) {
            DoLog(LogLevel.Warning, 'Original array\'s length is less than regular array, replace it with regular array.');
            original = regular;
        }
        if (isShowOriginal == null) {
            isShowOriginal = false;
        }

        if (original.length > 1) {
            $('.pp-page').text((index + 1) + '/' + regular.length);
            $('.pp-pageCount').show();
        }
        if (isShowOriginal) {
            $('.pp-image').addClass('original');
        } else {
            $('.pp-image').removeClass('original');
        }
        g_settings.original = isShowOriginal ? 1 : 0;

        // 隐藏页数和原图标签
        $('.pp-original, .pp-pageCount').hide();

        // 第一次需要绑定事件
        if ($('.pp-image').attr('index') == null || $('.pp-image').attr('pageCount') != regular.length) {
            $('.pp-image').attr('pageCount', regular.length);

            // 绑定点击事件，Ctrl+左键 单击切换原图
            $('.pp-image').on('click', function (ev) {
                var _this = $(this);
                var isOriginal = _this.hasClass('original');
                var index = _this.attr('index');
                if (index == null) {
                    index = 0;
                } else {
                    index = parseInt(index);
                }

                if (ev.ctrlKey) {
                    // 按住 Ctrl 来回切换原图
                    isOriginal = !isOriginal;
                    ViewImages(regular, index, original, isOriginal);
                }
                else if (ev.shiftKey) {
                    // 按住 Shift 点击图片新标签页打开原图
                    window.open(original[index]);
                } else {
                    if (regular.length == 1) {
                        return;
                    }
                    // 如果是多图，点击切换下一张
                    if (++index >= regular.length) {
                        index = 0;
                    }
                    ViewImages(regular, index, original, isOriginal);
                    // 预加载
                    for (var i = index + 1; i < regular.length && i <= index + 3; i++) {
                        var image = new Image();
                        image.src = isOriginal ? original[i] : regular[i];;
                    }
                }
            });

            // 图片预加载完成
            $('.pp-image').on('load', function () {
                // 调整图片位置和大小
                var _this = $(this);
                var size = AdjustDivPosition();
                var isShowOriginal = _this.hasClass('original');

                $('.pp-loading').css('display', 'none');
                // 显示图像、页数、原图标签
                $('.pp-image').css('display', '');
                if (regular.length > 1) {
                    $('.pp-pageCount').show();
                }
                if (isShowOriginal) {
                    $('.pp-original').show();
                }

                // 预加载
                for (var i = index + 1; i < regular.length && i <= index + 3; i++) {
                    var image = new Image();
                    image.src = isShowOriginal ? original[i] : regular[i];;
                }
            }).on('error', function () {
                DoLog(LogLevel.Error, 'Load image failed!');
            });
        }

        $('.pp-image').attr('src', isShowOriginal ? original[index] : regular[index]).attr('index', index);
    }

    // 处理自动加载
    function ProcessAutoLoad() {
        if (Pages[g_pageType].GetProcessedPageElements() == null) {
            DoLog(LogLevel.Error, 'Call ProcessPageElements first!');
            return;
        }

        var oldReturnMap = Pages[g_pageType].GetProcessedPageElements();
        var newReturnMap = Pages[g_pageType].ProcessPageElements();

        if (newReturnMap.loadingComplete) {
            if (oldReturnMap.controlElements.length < newReturnMap.controlElements.length || newReturnMap.forceUpdate) {
                DoLog(LogLevel.Info, 'Page loaded ' + (newReturnMap.controlElements.length - oldReturnMap.controlElements.length) + ' new work(s).');

                if (g_settings.linkBlank) {
                    $(newReturnMap.controlElements).find('a').attr('target', '_blank');
                }

                DeactivePreview();
                ActivePreview();

                return;
            } else if (oldReturnMap.controlElements.length > newReturnMap.controlElements.length) {
                DoLog(LogLevel.Warning, 'works become less?');

                Pages[g_pageType].private.returnMap = oldReturnMap;

                return;
            }
        }

        DoLog(LogLevel.Info, 'Page not change.');
    }

    // 开启预览
    ActivePreview();
}
/* ---------------------------------------- 排序 ---------------------------------------- */
let imageElementTemplate = null;
function PixivSK(callback) {
    // 不合理的设定
    if (g_settings.pageCount < 1 || g_settings.favFilter < 0) {
        g_settings.pageCount = 1;
        g_settings.favFilter = 0;
    }
    // 当前已经取得的页面数量
    var currentGettingPageCount = 0;
    // 当前加载的页面 URL
    var currentUrl = 'https://www.pixiv.net/ajax/search/';
    // 当前加载的是第几张页面
    var currentPage = 0;
    // 获取到的作品
    var works = [];

    // 仅搜索页启用
    if (g_pageType != PageType.Search) {
        return;
    }

    // 获取第 currentPage 页的作品
    var getWorks = function (onloadCallback) {
        var url = currentUrl.replace(/p=\d+/, 'p=' + currentPage);

        if (location.href.indexOf('?') != -1) {
            var param = location.href.split('?')[1];
            param = param.replace(/^p=\d+/, '');
            param = param.replace(/&p=\d+/, '');
            url += '&' + param;
        }

        if (url.indexOf('order=') == -1) {
            url += '&order=date_d';
        }
        if (url.indexOf('mode=') == -1) {
            url += '&mode=all';
        }
        if (url.indexOf('s_mode=') == -1) {
            url += '&s_mode=s_tag_full';
        }

        DoLog(LogLevel.Info, 'getWorks url: ' + url);

        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onload = function (event) {
            onloadCallback(req);
        };
        req.onerror = function (event) {
            DoLog(LogLevel.Error, 'Request search page error!');
        };

        req.send(null);
    };

    // 筛选已关注画师作品
    var filterByUser = function() {
        if (!g_enableFilterByUser) {
            return;
        } else {
            DoLog(LogLevel.Warning, 'All works by your favorite users will be hide!');
        }

        var members = [];

        // 只获取公开关注的用户，私有的就算了
        $.ajax('https://www.pixiv.net/bookmark.php?type=user&rest=show', {
            async: false,
            success: function(data) {
                var searchResult = $(data).find('#search-result');
                if (searchResult.length === 0) {
                    DoLog(LogLevel.Error, 'Can not found users.');
                    return;
                }

                var lis = searchResult.find('li');
                DoLog(LogLevel.Elements, lis);
                lis.each(function(i, e) {
                    var input = $(this).children('input');
                    if (input) {
                        members.push(input.attr('value'));
                    } else {
                        DoLot(LogLevel.Error, 'No <input> found.');
                    }
                });
            },
            error: function() {
                DoLog(LogLevel.Error, 'Request bookmarked user failed.');
            },
        });

        DoLog(LogLevel.Info, 'Get users success.');
        DoLog(LogLevel.Elements, members);

        var tempWorks = [];
        var hideWorkCount = 0;
        $(works).each(function (i, work) {
            var found = false;
            for (let i = 0; i < members.length; i++) {
                if (members[i] == work.userId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                tempWorks.push(work);
            } else {
                hideWorkCount++;
            }
        });
        works = tempWorks;

        DoLog(LogLevel.Info, hideWorkCount + ' works were hide.');
        DoLog(LogLevel.Elements, works);
    };

    // 排序和筛选
    var filterAndSort = function () {
        DoLog(LogLevel.Info, 'Start sort.');
        DoLog(LogLevel.Elements, works);
        // 收藏量低于 FAV_FILTER 的作品不显示
        var tmp = [];
        $(works).each(function (i, work) {
            var bookmarkCount = work.bookmarkCount ? work.bookmarkCount : 0;
            if (bookmarkCount >= g_settings.favFilter && !(g_settings.hideFavorite && work.bookmarkData)) {
                tmp.push(work);
            }
        });
        works = tmp;

        filterByUser();

        // 排序
        works.sort(function (a, b) {
            var favA = a.bookmarkCount;
            var favB = b.bookmarkCount;
            if (!favA) {
                favA = 0;
            }
            if (!favB) {
                favB = 0;
            }
            if (favA > favB) {
                return -1;
            }
            if (favA < favB) {
                return 1;
            }
            return 0;
        });
        DoLog(LogLevel.Info, 'Sort complete.');
        DoLog(LogLevel.Elements, works);
    };

    if (currentPage === 0) {
        var url = location.href;

        if (url.indexOf('&p=') == -1 && url.indexOf('?p=') == -1) {
            DoLog(LogLevel.Warning, 'Can not found page in url.');
            if (url.indexOf('?') == -1) {
                url += '?p=1';
                DoLog(LogLevel.Info, 'Add "?p=1": ' + url);
            } else {
                url += '&p=1';
                DoLog(LogLevel.Info, 'Add "&p=1": ' + url);
            }
        }
        var wordMatch = url.match(/\/tags\/([^/]*)\//);
        var searchWord = '';
        if (wordMatch) {
            DoLog(LogLevel.Info, 'Search key word: ' + searchWord);
            searchWord = wordMatch[1];
        } else {
            DoLog(LogLevel.Error, 'Can not found search key word!');
            return;
        }

        // page
        var page = url.match(/p=(\d*)/)[1];
        currentPage = parseInt(page);
        DoLog(LogLevel.Info, 'Current page: ' + currentPage);

        var type = url.match(/tags\/.*\/(.*)[?$]/)[1];
        currentUrl += type + '/';

        currentUrl += searchWord + '?word=' + searchWord + '&p=' + currentPage;
        DoLog(LogLevel.Info, 'Current url: ' + currentUrl);
    } else {
        DoLog(LogLevel.Error, '???');
    }

    var imageContainer = Pages[PageType.Search].GetImageListContainer();
    // loading
    $(imageContainer).hide().before('<div id="loading" style="width:50px;margin-left:auto;margin-right:auto;"><img src="' + g_loadingImage + '" /><p id="progress" style="text-align: center;font-size: large;font-weight: bold;padding-top: 10px;">0%</p></div>');

    // page
    if (true) {
        var pageSelectorDiv = Pages[PageType.Search].GetPageSelector();
        if (pageSelectorDiv == null) {
            DoLog(LogLevel.Error, 'Can not found page selector!');
            return;
        }

        if ($(pageSelectorDiv).find('a').length > 2) {
            var pageButton = $(pageSelectorDiv).find('a').get(1);
            var newPageButtons = [];
            var pageButtonString = 'Previewer';
            for (var i = 0; i < 9; i++) {
                var newPageButton = pageButton.cloneNode(true);
                $(newPageButton).find('span').text(pageButtonString[i]);
                newPageButtons.push(newPageButton);
            }

            $(pageSelectorDiv).find('button').remove();
            while ($(pageSelectorDiv).find('a').length > 2) {
                $(pageSelectorDiv).find('a:first').next().remove();
            }

            for (i = 0; i < 9; i++) {
                $(pageSelectorDiv).find('a:last').before(newPageButtons[i]);
            }

            $(pageSelectorDiv).find('a').attr('href', 'javascript:;');

            var pageUrl = location.href;
            if (pageUrl.indexOf('&p=') == -1 && pageUrl.indexOf('?p=') == -1) {
                if (pageUrl.indexOf('?') == -1) {
                    pageUrl += '?p=1';
                } else {
                    pageUrl += '&p=1';
                }
            }
            var prevPageUrl = pageUrl.replace(/p=\d+/, 'p=' + (currentPage - g_settings.pageCount > 1 ? currentPage - g_settings.pageCount : 1));
            var nextPageUrl = pageUrl.replace(/p=\d+/, 'p=' + (currentPage + g_settings.pageCount));
            DoLog(LogLevel.Info, 'Previous page url: ' + prevPageUrl);
            DoLog(LogLevel.Info, 'Next page url: ' + nextPageUrl);
            // 重新插入一遍清除事件绑定
            var prevButton = $(pageSelectorDiv).find('a:first');
            prevButton.before(prevButton.clone());
            prevButton.remove();
            var nextButton = $(pageSelectorDiv).find('a:last');
            nextButton.before(nextButton.clone());
            nextButton.remove();
            $(pageSelectorDiv).find('a:first').attr('href', prevPageUrl).addClass('pp-prevPage');
            $(pageSelectorDiv).find('a:last').attr('href', nextPageUrl).addClass('pp-nextPage');
        }

        var onloadCallback = function (req) {
            let no_artworks_found = false;

            try {
                var json = JSON.parse(req.responseText);
                if (json.hasOwnProperty('error')) {
                    if (json.error === false) {
                        var data;
                        if (json.body.illustManga)
                            data = json.body.illustManga.data;
                        else if (json.body.manga)
                            data = json.body.manga.data;
                        else if (json.body.illust)
                            data = json.body.illust.data;
                        if (data.length > 0) {
                            works = works.concat(data);
                        } else {
                            no_artworks_found = true;
                        }
                    } else {
                        DoLog(LogLevel.Error, 'ajax error!');
                        return;
                    }
                } else {
                    DoLog(LogLevel.Error, 'Key "error" not found!');
                    return;
                }
            } catch (e) {
                DoLog(LogLevel.Error, 'A invalid json string!');
                DoLog(LogLevel.Info, req.responseText);
            }

            currentPage++;
            currentGettingPageCount++;

            // 后面已经没有作品了
            if (no_artworks_found) {
                DoLog(LogLevel.Warning, 'No artworks found, ignore ' + (g_settings.pageCount - currentGettingPageCount) + ' pages.');
                currentPage += g_settings.pageCount - currentGettingPageCount;
                currentGettingPageCount = g_settings.pageCount;
            }
            // 设定数量的页面加载完成
            if (currentGettingPageCount == g_settings.pageCount) {
                DoLog(LogLevel.Info, 'Load complete, start to load bookmark count.');
                DoLog(LogLevel.Elements, works);

                // 获取到的作品里面可能有广告，先删掉，否则后面一些处理需要做判断
                var tempWorks = [];
                for (var i = 0; i < works.length; i++) {
                    if (works[i].illustId) {
                        tempWorks.push(works[i]);
                    }
                }
                works = tempWorks;
                DoLog(LogLevel.Info, 'Clear ad container complete.');
                DoLog(LogLevel.Elements, works);

                GetBookmarkCount(0);
            } else {
                getWorks(onloadCallback);
            }
        };

        getWorks(onloadCallback);
    }

    var xhrs = [];
    var currentRequestGroupMinimumIndex = 0;
    function FillXhrsArray() {
        xhrs.length = 0;
        var onloadFunc = function (event) {
            let json = null;
            try {
                json = JSON.parse(event.currentTarget.responseText);
            } catch(e) {
                DoLog(LogLevel.Error, 'Parse json failed!');
                DoLog(LogLevel.Element, e);
                return;
            }

            if (json) {
                var bookmarkCount = json.body.illust_details.bookmark_user_total;
                var illustId = '';
                var illustIdMatched = event.currentTarget.responseURL.match(/illust_id=(\d+)/);
                if (illustIdMatched) {
                    illustId = illustIdMatched[1];
                } else {
                    DoLog(LogLevel.Error, 'Can not get illust id from url!');
                    return;
                }
                var indexOfThisRequest = -1;
                for (var j = 0; j < g_maxXhr; j++) {
                    if (xhrs[j].illustId == illustId) {
                        indexOfThisRequest = j;
                        break;
                    }
                }
                if (indexOfThisRequest == -1) {
                    DoLog('This url not match any request!');
                    return;
                }
                xhrs[indexOfThisRequest].complete = true;

                works[currentRequestGroupMinimumIndex + indexOfThisRequest].bookmarkCount = parseInt(bookmarkCount);
                DoLog(LogLevel.Info, 'IllustId: ' + illustId + ', bookmarkCount: ' + bookmarkCount);

                var completeCount = 0;
                for (j = 0; j < g_maxXhr; j++) {
                    if (xhrs[j].complete) {
                        completeCount++;
                    }
                }
                if (completeCount == g_maxXhr) {
                    $('#loading').find('#progress').text(parseInt((currentRequestGroupMinimumIndex + 1) * 1.0 / works.length * 100) + '%');
                    currentRequestGroupMinimumIndex += g_maxXhr;
                    GetBookmarkCount(currentRequestGroupMinimumIndex);
                }
            }
        };
        var onerrorFunc = function (event) {
            var illustId = '';
            var illustIdMatched = event.currentTarget.responseUrl.match(/artworks\/(\d+)/);
            if (illustIdMatched) {
                illustId = illustIdMatched[1];
            } else {
                DoLog(LogLevel.Error, 'Can not get illust id from url!');
                return;
            }

            DoLog(LogLevel.Error, 'Send request failed, set this illust(' + illustId + ')\'s bookmark count to 0!');

            var indexOfThisRequest = -1;
            for (var j = 0; j < g_maxXhr; j++) {
                if (xhrs[j].illustId == illustId) {
                    indexOfThisRequest = j;
                    break;
                }
            }
            if (indexOfThisRequest == -1) {
                DoLog('This url not match any request!');
                return;
            }
            xhrs[indexOfThisRequest].complete = true;

            var completeCount = 0;
            for (j = 0; j < g_maxXhr; j++) {
                if (xhrs[j].complete) {
                    completeCount++;
                }
            }
            if (completeCount == g_maxXhr) {
                $('#loading').find('#progress').text(parseInt((currentRequestGroupMinimumIndex + 1) * 1.0 / works.length * 100) + '%');
                GetBookmarkCount(currentRequestGroupMinimumIndex + g_maxXhr);
            }
        };
        for (var i = 0; i < g_maxXhr; i++) {
            xhrs.push({
                xhr: new XMLHttpRequest(),
                illustId: '',
                complete: false,
            });
            xhrs[i].xhr.onload = onloadFunc;
            xhrs[i].xhr.onerror = onerrorFunc;
        }
    }

    var GetBookmarkCount = function (index) {
        if (index >= works.length) {
            clearAndUpdateWorks();
            return;
        }

        if (xhrs.length === 0) {
            FillXhrsArray();
        }

        for (var i = 0; i < g_maxXhr; i++) {
            if (index + i >= works.length) {
                xhrs[i].complete = true;
                continue;
            }

            var illustId = works[index + i].illustId;
            var url = 'https://www.pixiv.net/touch/ajax/illust/details?illust_id=' + illustId;
            xhrs[i].illustId = illustId;
            xhrs[i].complete = false;
            xhrs[i].xhr.open('GET', url, true);
            xhrs[i].xhr.send(null);
        }
    };

    /*
    li
    -div
    --div
    ---div
    ----div
    -----div
    ------a
    -------div: 多图标签、R18标签
    -------div: 里面是 img （以及 svg 动图标签）
    ------div: 里面是 like 相关的元素
    ---a: 作品标题，跳转链接
    ---div: 作者头像和昵称
    */
    var clearAndUpdateWorks = function () {
        filterAndSort();

        var container = Pages[PageType.Search].GetImageListContainer();
        var firstImageElement = Pages[PageType.Search].GetFirstImageElement();
        if (imageElementTemplate == null) {
            imageElementTemplate = firstImageElement.cloneNode(true);

            // 清理模板
            // image
            var img = $($(imageElementTemplate).find('img').get(0));
            var imageDiv = img.parent();
            var imageLink = imageDiv.parent();
            var imageLinkDiv = imageLink.parent();
            var titleLink = imageLinkDiv.parent().next();
            if (img == null || imageDiv == null || imageLink == null || imageLinkDiv == null || titleLink == null) {
                DoLog(LogLevel.Error, 'Can not found some elements!');
            }

            // author
            var authorDiv = titleLink.next();
            var authorLinkProfileImage = authorDiv.find('a:first');
            var authorLink = authorDiv.find('a:last');
            var authorName = authorLink;
            var authorImage = $(authorDiv.find('img').get(0));

            // others
            var bookmarkDiv = imageLink.next();
            var bookmarkSvg = bookmarkDiv.find('svg');
            var additionTagDiv = imageDiv.prev();
            var animationTag = imageDiv.find('svg');

            var bookmarkCountDiv = additionTagDiv.clone();
            bookmarkCountDiv.css({ 'top': 'auto', 'bottom': '0px', 'width': '50%' });
            additionTagDiv.parent().append(bookmarkCountDiv);

            // 添加 class，方便后面修改内容
            img.addClass('ppImg');
            imageLink.addClass('ppImageLink');
            titleLink.addClass('ppTitleLink');
            authorLinkProfileImage.addClass('ppAuthorLinkProfileImage');
            authorLink.addClass('ppAuthorLink');
            authorName.addClass('ppAuthorName');
            authorImage.addClass('ppAuthorImage');
            bookmarkSvg.addClass('ppBookmarkSvg');
            additionTagDiv.addClass('ppAdditionTag');
            bookmarkCountDiv.addClass('ppBookmarkCount');

            img.attr('src', '');
            additionTagDiv.empty();
            bookmarkCountDiv.empty();
            animationTag.remove();
            bookmarkSvg.find('path:first').css('fill', 'rgb(31, 31, 31)');
            bookmarkSvg.find('path:last').css('fill', 'rgb(255, 255, 255)');

            if (g_settings.linkBlank) {
                imageLink.attr('target', '_blank');
                titleLink.attr('target', '_blank');
                authorLinkProfileImage.attr('target', '_blank');
                authorLink.attr('target', '_blank');
            }
        }

        $(container).empty();
        for (var i = 0; i < works.length; i++) {
            var li = $(imageElementTemplate.cloneNode(true));

            li.find('.ppImg').attr('src', works[i].url);
            li.find('.ppImageLink').attr('href', '/artworks/' + works[i].illustId);
            li.find('.ppTitleLink').attr('href', '/artworks/' + works[i].illustId).text(works[i].title);
            li.find('.ppAuthorLink, .ppAuthorLinkProfileImage').attr('href', '/member.php?id=' + works[i].userId).attr({'userId': works[i].userId, 'profileImageUrl': works[i].profileImageUrl, 'userName': works[i].userName});
            li.find('.ppAuthorName').text(works[i].userName);
            li.find('.ppAuthorImage').attr('src', works[i].profileImageUrl);
            li.find('.ppBookmarkSvg').attr('illustId', works[i].illustId);
            if (works[i].bookmarkData) {
                li.find('.ppBookmarkSvg').find('path').css('fill', 'rgb(255, 64, 96)');
                li.find('.ppBookmarkSvg').attr('bookmarkId', works[i].bookmarkData.id);
            }
            if (works[i].xRestrict !== 0) {
                var R18HTML = '<div style="margin-top: 2px; margin-left: 2px;"><div style="color: rgb(255, 255, 255);font-weight: bold;font-size: 10px;line-height: 1;padding: 3px 6px;border-radius: 3px;background: rgb(255, 64, 96);">R-18</div></div>';
                li.find('.ppAdditionTag').append(R18HTML);
            }
            if (works[i].pageCount > 1) {
                var pageCountHTML = '<div style="display: flex;-webkit-box-align: center;align-items: center;box-sizing: border-box;margin-left: auto;height: 20px;color: rgb(255, 255, 255);font-size: 10px;line-height: 12px;font-weight: bold;flex: 0 0 auto;padding: 4px 6px;background: rgba(0, 0, 0, 0.32);border-radius: 10px;">\<svg viewBox="0 0 9 10" width="9" height="10" style="stroke: none;line-height: 0;font-size: 0px;fill: currentcolor;"><path d="M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"></path></svg><span style="margin-left: 2px;">' + works[i].pageCount + '</span></div>';
                li.find('.ppAdditionTag').append(pageCountHTML);
            }
            var bookmarkCountHTML = '<div style="margin-bottom: 6px; margin-left: 2px;"><div style="color: rgb(7, 95, 166);font-weight: bold;font-size: 13px;line-height: 1;padding: 3px 6px;border-radius: 3px;background: rgb(204, 236, 255);">' + works[i].bookmarkCount + ' likes</div></div>';
            li.find('.ppBookmarkCount').append(bookmarkCountHTML);
            if (works[i].illustType == 2) {
                var animationHTML = '<svg viewBox="0 0 24 24" style="width: 48px; height: 48px;stroke: none;fill: rgb(255, 255, 255);line-height: 0;font-size: 0px;vertical-align: middle;position:absolute;"><circle cx="12" cy="12" r="10" style="fill: rgb(0, 0, 0);fill-opacity: 0.4;"></circle><path d="M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834 C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342 C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799 C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243 C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652 C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z"></path></svg>';
                li.find('.ppImg').after(animationHTML);
            }

            $(container).append(li);
        }

        // 监听加入书签点击事件，监听父节点，但是按照 <svg> 节点处理
        $('.ppBookmarkSvg').parent().on('click', function () {
            if (g_csrfToken == '') {
                DoLog(LogLevel.Error, 'No g_csrfToken, failed to add bookmark!');
                alert('获取 Token 失败，无法添加，请到详情页操作。');
                return;
            }

            var _this = $(this).children('svg:first');
            var illustId = _this.attr('illustId');
            var bookmarkId = _this.attr('bookmarkId');
            if (bookmarkId == null || bookmarkId == '') {
                DoLog(LogLevel.Info, 'Add bookmark, illustId: ' + illustId);
                $.ajax('/ajax/illusts/bookmarks/add', {
                    method: 'POST',
                    contentType: 'application/json;charset=utf-8',
                    headers: { 'x-csrf-token': g_csrfToken },
                    data: '{"illust_id":"' + illustId + '","restrict":0,"comment":"","tags":[]}',
                    success: function (data) {
                        DoLog(LogLevel.Info, 'addBookmark result: ');
                        DoLog(LogLevel.Elements, data);
                        if (data.error) {
                            DoLog(LogLevel.Error, 'Server returned an error: ' + data.message);
                            return;
                        }
                        var bookmarkId = data.body.last_bookmark_id;
                        DoLog(LogLevel.Info, 'Add bookmark success, bookmarkId is ' + bookmarkId);
                        _this.attr('bookmarkId', bookmarkId);
                        _this.find('path').css('fill', 'rgb(255, 64, 96)');
                    }
                });
            } else {
                DoLog(LogLevel.Info, 'Delete bookmark, bookmarkId: ' + bookmarkId);
                $.ajax('/rpc/index.php', {
                    method: 'POST',
                    headers: { 'x-csrf-token': g_csrfToken },
                    data: { "mode": "delete_illust_bookmark", "bookmark_id": bookmarkId },
                    success: function (data) {
                        DoLog(LogLevel.Info, 'addBookmark result: ');
                        DoLog(LogLevel.Elements, data);
                        if (data.error) {
                            DoLog(LogLevel.Error, 'Server returned an error: ' + data.message);
                            return;
                        }
                        DoLog(LogLevel.Info, 'Delete bookmark success.');
                        _this.attr('bookmarkId', '');
                        _this.find('path:first').css('fill', 'rgb(31, 31, 31)');
                        _this.find('path:last').css('fill', 'rgb(255, 255, 255)');
                    }
                });
            }

            _this.parent().focus();
        });

        $('.ppAuthorLink').on('mouseenter', function(e){
            var _this = $(this);

            function getOffset(e) {
                if (e.offsetParent) {
                    var offset = getOffset(e.offsetParent);
                    return {
                        offsetTop: e.offsetTop + offset.offsetTop,
                        offsetLeft: e.offsetLeft + offset.offsetLeft,
                    };
                } else {
                    return {
                        offsetTop: e.offsetTop,
                        offsetLeft: e.offsetLeft,
                    };
                }
            }

            var isFollowed = false;
            $.ajax('https://www.pixiv.net/ajax/user/' + _this.attr('userId') + '?full=1', {
                method: 'GET',
                async: false,
                success: function(data) {
                    if (data.error == false && data.body.isFollowed) {
                        isFollowed = true;
                    }
                },
            });

            $('.pp-authorDiv').remove();
            var pres = $('<div class="pp-authorDiv"><div class="ppa-main" style="position: absolute; top: 0px; left: 0px; border-width: 1px; border-style: solid; z-index: 1; border-color: rgba(0, 0, 0, 0.08); border-radius: 8px;"><div class=""style="    width: 336px;    background-color: rgb(255, 255, 255);    padding-top: 24px;    flex-flow: column;"><div class=""style=" display: flex; align-items: center; flex-flow: column;"><a class="ppa-authorLink"><div role="img"size="64"class=""style=" display: inline-block; width: 64px; height: 64px; border-radius: 50%; overflow: hidden;"><img class="ppa-authorImage" width="64"height="64"style="object-fit: cover; object-position: center top;"></div></a><a class="ppa-authorLink"><div class="ppa-authorName" style=" line-height: 24px; font-size: 16px; font-weight: bold; margin: 4px 0px 0px;"></div></a><div class=""style=" margin: 12px 0px 24px;"><button type="button"class="ppa-follow"style=" padding: 9px 25px; line-height: 1; border: none; border-radius: 16px; font-weight: 700; background-color: #0096fa; color: #fff; cursor: pointer;"><span style="margin-right: 4px;"><svg viewBox="0 0 8 8"width="10"height="10"class=""style=" stroke: rgb(255, 255, 255); stroke-linecap: round; stroke-width: 2;"><line x1="1"y1="4"x2="7"y2="4"></line><line x1="4"y1="1"x2="4"y2="7"></line></svg></span>关注</button></div></div></div></div></div>');
            $('body').append(pres);
            var offset = getOffset(this);
            pres.find('.ppa-main').css({'top': offset.offsetTop - 196 + 'px', 'left': offset.offsetLeft - 113 + 'px'});
            pres.find('.ppa-authorLink').attr('href', '/member.php?id=' + _this.attr('userId'));
            pres.find('.ppa-authorImage').attr('src', _this.attr('profileImageUrl'));
            pres.find('.ppa-authorName').text(_this.attr('userName'));
            if (isFollowed) {
                pres.find('.ppa-follow').get(0).outerHTML = '<button type="button" class="ppa-follow followed" data-click-action="click" data-click-label="follow" style="padding: 9px 25px;line-height: 1;border: none;border-radius: 16px;font-size: 14px;font-weight: 700;cursor: pointer;">关注中</button>';
            }
            pres.find('.ppa-follow').attr('userId', _this.attr('userId'));
            pres.on('mouseleave', function(e) {
                $(this).remove();
            }).on('mouseenter', function() {
                $(this).addClass('mouseenter');
            });

            pres.find('.ppa-follow').on('click', function() {
                var userId = $(this).attr('userId');
                if ($(this).hasClass('followed')) {
                    // 取关
                    $.ajax('https://www.pixiv.net/rpc_group_setting.php', {
                        method: 'POST',
                        headers: { 'x-csrf-token': g_csrfToken },
                        data: 'mode=del&type=bookuser&id=' + userId,
                        success: function(data) {
                            DoLog(LogLevel.Info, 'delete bookmark result: ');
                            DoLog(LogLevel.Elements, data);

                            if (data.type == 'bookuser') {
                                $('.ppa-follow').get(0).outerHTML = '<button type="button"class="ppa-follow"style=" padding: 9px 25px; line-height: 1; border: none; border-radius: 16px; font-weight: 700; background-color: #0096fa; color: #fff; cursor: pointer;"><span style="margin-right: 4px;"><svg viewBox="0 0 8 8"width="10"height="10"class=""style=" stroke: rgb(255, 255, 255); stroke-linecap: round; stroke-width: 2;"><line x1="1"y1="4"x2="7"y2="4"></line><line x1="4"y1="1"x2="4"y2="7"></line></svg></span>关注</button>';
                            }
                            else {
                                DoLog(LogLevel.Error, 'Delete follow failed!');
                            }
                        }
                    });
                } else {
                    // 关注
                    $.ajax('https://www.pixiv.net/bookmark_add.php', {
                        method: 'POST',
                        headers: {'x-csrf-token': g_csrfToken},
                        data: 'mode=add&type=user&user_id=' + userId + '&tag=&restrict=0&format=json',
                        success: function (data) {
                            DoLog(LogLevel.Info, 'addBookmark result: ');
                            DoLog(LogLevel.Elements, data);
                            // success
                            if (data.length === 0) {
                                $('.ppa-follow').get(0).outerHTML = '<button type="button" class="ppa-follow followed" data-click-action="click" data-click-label="follow" style="padding: 9px 25px;line-height: 1;border: none;border-radius: 16px;font-size: 14px;font-weight: 700;cursor: pointer;">关注中</button>';
                            } else {
                                DoLog(LogLevel.Error, 'Follow failed!');
                            }
                        }
                    });
                }
            });
        }).on('mouseleave', function(e) {
            setTimeout(function() {
                if (!$('.pp-authorDiv').hasClass('mouseenter')) {
                    $('.pp-authorDiv').remove();
                }
            }, 200);
        });

        if (works.length === 0) {
            $(container).show().get(0).outerHTML = '<div class=""style="display: flex;align-items: center;justify-content: center; height: 408px;flex-flow: column;"><div class=""style="margin-bottom: 12px;color: rgba(0, 0, 0, 0.16);"><svg viewBox="0 0 16 16"size="72"style="fill: currentcolor;height: 72px;vertical-align: middle;"><path d="M8.25739 9.1716C7.46696 9.69512 6.51908 10 5.5 10C2.73858 10 0.5 7.76142 0.5 5C0.5			2.23858 2.73858 0 5.5 0C8.26142 0 10.5 2.23858 10.5 5C10.5 6.01908 10.1951 6.96696 9.67161			7.75739L11.7071 9.79288C12.0976 10.1834 12.0976 10.8166 11.7071 11.2071C11.3166 11.5976 10.6834			11.5976 10.2929 11.2071L8.25739 9.1716ZM8.5 5C8.5 6.65685 7.15685 8 5.5 8C3.84315 8 2.5 6.65685			2.5 5C2.5 3.34315 3.84315 2 5.5 2C7.15685 2 8.5 3.34315 8.5 5Z"transform="translate(2.25 2.25)"fill-rule="evenodd"clip-rule="evenodd"></path></svg></div><span class="sc-LzMCO fLDUzU">' + Texts[g_language].sort_noWork + '</span></div>';
        }

        // 恢复显示
        $('#loading').remove();
        $(container).show();

        Pages[PageType.Search].ProcessPageElements();

        // 监听键盘的左右键，用来翻页
        $(document).keydown(function (e) {
            if (g_settings.pageByKey != 1) {
                return;
            }
            if (e.keyCode == 39) {
                var btn = $('.pp-nextPage');
                if (btn.length < 1 || btn.attr('hidden') == 'hidden') {
                    return;
                }
                // 很奇怪不能用 click()
                location.href = btn.attr('href');
            } else if (e.keyCode == 37) {
                var btn = $('.pp-prevPage');
                if (btn.length < 1 || btn.attr('hidden') == 'hidden') {
                    return;
                }
                location.href = btn.attr('href');
            }
        });

        if (callback) {
            callback();
        }
    }
    }
/* ---------------------------------------- 设置 ---------------------------------------- */
function SetCookie(name, value) {
    var Days = 180;
    var exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    var str = JSON.stringify(value);
    document.cookie = name + "=" + str + ";expires=" + exp.toGMTString() + ';path=\/';
}
function GetCookie(name) {
    var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if (arr = document.cookie.match(reg)) {
        return unescape(arr[2]);
    }
    else {
        return null;
    }
}
function ShowInstallMessage() {
    $('#pp-bg').remove();
    var bg = $('<div id="pp-bg"></div>').css({
        'width': document.documentElement.clientWidth + 'px', 'height': document.documentElement.clientHeight + 'px', 'position': 'fixed',
        'z-index': 999999, 'background-color': 'rgba(0,0,0,0.8)',
        'left': '0px', 'top': '0px'
    });
    $('body').append(bg);

    bg.get(0).innerHTML = '<img id="pps-close"src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png"style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute;width: 40%;left: 30%;top: 25%;font-size: 25px; text-align: center; color: white;">' + Texts[g_language].install_title + g_version + '</div><br>' + Texts[g_language].install_body;
    $('#pps-close').click(function () {
        $('#pp-bg').remove();
    });
}
function GetSettings() {
    var settings;

    var cookie = GetCookie('PixivPreview');
    // 新安装
    if (cookie == null || cookie == 'null') {
        settings = g_defaultSettings;
        SetCookie('PixivPreview', settings);

        ShowInstallMessage();
    } else {
        settings = JSON.parse(cookie);
    }

    // 升级
    if (settings.version != g_version) {
        ShowInstallMessage();
    }

    if (settings.version == null || settings.version != g_version) {
        settings.version = g_version;
        SetCookie('PixivPreview', settings);
    }

    return settings;
}
function ShowSetting() {
    var screenWidth = document.documentElement.clientWidth;
    var screenHeight = document.documentElement.clientHeight;

    $('#pp-bg').remove();
    var bg = $('<div id="pp-bg"></div>').css({
        'width': screenWidth + 'px', 'height': screenHeight + 'px', 'position': 'fixed',
        'z-index': 999999, 'background-color': 'rgba(0,0,0,0.8)',
        'left': '0px', 'top': '0px'
    });
    $('body').append(bg);

    var settings = GetSettings();

    var settingHTML = '<div style="color: white; font-size: 1em;"><img id="pps-close" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Close.png" style="position: absolute; right: 35px; top: 20px; width: 32px; height: 32px; cursor: pointer;"><div style="position: absolute; width: 40%; left: 25%; top: 25%; overflow: hidden;"><ul style="list-style: none; padding: 0; margin: 0;"><li style="height: 32px; font-size: 25px;">' + Texts[g_language].setting_preview + '</li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_sort +'</li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_anime+'</li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_origin+'</li><li style="height: 32px; font-size: 25px;"></li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_maxPage+'</li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_hideWork+'</li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_hideFav+'</li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_blank+'</li><li style="height: 32px; font-size: 25px;">'+Texts[g_language].setting_turnPage+'</li></ul></div><div id="pps-right" style="position: absolute; width: 10%; right: 25%; text-align: right; top: 25%;"><ul style="list-style: none; padding: 0; margin: 0;"><li style="height: 32px;"><img id="pps-preview" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer;"></li><li style="height: 32px;"><img id="pps-sort" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer;"></li><li style="height: 32px;"><img id="pps-anime" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer;"></li><li style="height: 32px;"><img id="pps-original" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer;"></li><li style="height: 32px;"></li><li style="height: 32px;"><input id="pps-maxPage" style="height: 28px; font-size: 24px; padding: 0px; margin: 0px; border-width: 0px; width: 64px; text-align: center;"></li><li style="height: 32px;"><input id="pps-hideLess" style="height: 28px; font-size: 24px; padding: 0px; margin: 0px; border-width: 0px; width: 64px; text-align: center;"></li><li style="height: 32px;"><img id="pps-hideBookmarked" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer;"></li><li style="height: 32px;"><img id="pps-newTab" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer;"></li><li style="height: 32px;"><img id="pps-pageKey" src="https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png" style="height: 32px; cursor: pointer;"></li></ul></div><div style="margin-top: 10px;position: absolute;bottom: 20%;width: 100%;text-align: center;"><button id="pps-save" style="font-size: 25px;border-radius: 15px;height: 48px;width: 128px;background-color: green;color: white;margin: 0 32px 0 32px;cursor: pointer;border: none;">'+Texts[g_language].setting_save+'</button><button id="pps-reset" style="font-size: 25px;border-radius: 15px;height: 48px;width: 128px;background-color: darkred;color: white;margin: 0 32px 0 32px;cursor: pointer;border: none;">'+Texts[g_language].setting_reset+'</button></div></div>';

    bg.get(0).innerHTML = settingHTML;

    var imgOn = 'https://pp-1252089172.cos.ap-chengdu.myqcloud.com/On.png';
    var imgOff = 'https://pp-1252089172.cos.ap-chengdu.myqcloud.com/Off.png'
    $('#pps-preview').attr('src', settings.enablePreview ? imgOn : imgOff).addClass(settings.enablePreview ? 'on' : 'off');
    $('#pps-sort').attr('src', settings.enableSort ? imgOn : imgOff).addClass(settings.enableSort ? 'on' : 'off');
    $('#pps-anime').attr('src', settings.enableAnimeDownload ? imgOn : imgOff).addClass(settings.enableAnimeDownload ? 'on' : 'off');
    $('#pps-original').attr('src', settings.original ? imgOn : imgOff).addClass(settings.original ? 'on' : 'off');
    $('#pps-maxPage').val(settings.pageCount);
    $('#pps-hideLess').val(settings.favFilter);
    $('#pps-hideBookmarked').attr('src', settings.hideFavorite ? imgOn : imgOff).addClass(settings.hideFavorite ? 'on' : 'off');
    $('#pps-newTab').attr('src', settings.linkBlank ? imgOn : imgOff).addClass(settings.linkBlank ? 'on' : 'off');
    $('#pps-pageKey').attr('src', settings.pageByKey ? imgOn : imgOff).addClass(settings.pageByKey ? 'on' : 'off');

    $('#pps-right').find('img').click(function () {
        var _this = $(this);

        if (_this.hasClass('on')) {
            _this.attr('src', imgOff).removeClass('on').addClass('off');
        } else {
            _this.attr('src', imgOn).removeClass('off').addClass('on');
        }
    });

    $('#pps-save').click(function () {
        if ($('#pps-maxPage').val() === '') {
            $('#pps-maxPage').val(g_defaultSettings.pageCount);
        }
        if ($('#pps-hideLess').val() == '') {
            $('#pps-hideLess').val(g_defaultSettings.favFilter);
        }

        var settings = {
            'enablePreview': $('#pps-preview').hasClass('on') ? 1 : 0,
            'enableSort': $('#pps-sort').hasClass('on') ? 1 : 0,
            'enableAnimeDownload': $('#pps-anime').hasClass('on') ? 1 : 0,
            'original': $('#pps-original').hasClass('on') ? 1 : 0,
            'pageCount': parseInt($('#pps-maxPage').val()),
            'favFilter': parseInt($('#pps-hideLess').val()),
            'hideFavorite': $('#pps-hideBookmarked').hasClass('on') ? 1 : 0,
            'linkBlank': $('#pps-newTab').hasClass('on') ? 1 : 0,
            'pageByKey': $('#pps-pageKey').hasClass('on') ? 1 : 0,
            'version': g_version,
        }

        SetCookie('PixivPreview', settings);

        location.href = location.href;
    });

    $('#pps-reset').click(function () {
        var comfirmText = Texts[g_language].setting_resetHint;
        if (confirm(comfirmText)) {
            SetCookie('PixivPreview', null);
            location.href = location.href;
        }
    });

    $('#pps-close').click(function () {
        $('#pp-bg').remove();
    });

    // 不换行
    $('#pp-bg').find('li').css('overflow', 'hidden');

    if (screenWidth < 1400) {
        var fontSize = parseInt(25 - (1400 - screenWidth) / 40);
        $('#pp-bg').find('li').css('font-size', fontSize + 'px');
    }
}
/* --------------------------------------- 主函数 --------------------------------------- */
var loadInterval = null;
let itv = null;
function Load() {
    // 匹配当前页面
    for (var i = 0; i < PageType.PageTypeCount; i++) {
        if (Pages[i].CheckUrl(location.href)) {
            g_pageType = i;
            break;
        }
    }
    if (g_pageType >= 0) {
        DoLog(LogLevel.Info, 'Current page is ' + Pages[g_pageType].PageTypeString);
    } else {
        DoLog(LogLevel.Info, 'Unsupported page.');
        clearInterval(loadInterval);
        return;
    }

    // 自动检测语言
    if (g_autoDetectLanguage) {
        var lang = $('html').attr('lang');
        if (lang.indexOf('zh') != -1) {
            // 简体中文和繁体中文都用简体中文
            g_language = Lang.zh_CN;
        } else {
            // 其他的统一用英语，其他语言也不知道谷歌翻译得对不对
            g_language = Lang.en_US;
        }
    }

    // 设置按钮
    var toolBar = Pages[g_pageType].GetToolBar();
    if (toolBar) {
        DoLog(LogLevel.Elements, toolBar);
        clearInterval(loadInterval);
    } else {
        DoLog(LogLevel.Warning, 'Get toolbar failed.');
        return;
    }

    window.onresize = function() {
        if ($('#pps-save').length > 0) {
            var screenWidth = document.documentElement.clientWidth;
            var screenHeight = document.documentElement.clientHeight;
            $('#pp-bg').css({'width': screenWidth + 'px', 'height': screenHeight + 'px'});

            if (screenWidth < 1400) {
                var fontSize = parseInt(25 - (1400 - screenWidth) / 40);
                $('#pp-bg').find('li').css('font-size', fontSize + 'px');
            }
        }
    };

    if ($('#pp-settings').length == 0) {
        toolBar.appendChild(toolBar.firstChild.cloneNode(true));
        toolBar.lastChild.outerHTML = '<button id="pp-settings" style="background-color: rgb(0, 0, 0);margin-top: 5px;opacity: 0.8;cursor: pointer;border: none;padding: 12px;border-radius: 24px;width: 48px;height: 48px;"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve" style="fill: white;"><metadata> Svg Vector Icons : http://www.sfont.cn </metadata><g><path d="M377.5,500c0,67.7,54.8,122.5,122.5,122.5S622.5,567.7,622.5,500S567.7,377.5,500,377.5S377.5,432.3,377.5,500z"></path><path d="M990,546v-94.8L856.2,411c-8.9-35.8-23-69.4-41.6-100.2L879,186L812,119L689,185.2c-30.8-18.5-64.4-32.6-100.2-41.5L545.9,10h-94.8L411,143.8c-35.8,8.9-69.5,23-100.2,41.5L186.1,121l-67,66.9L185.2,311c-18.6,30.8-32.6,64.4-41.5,100.3L10,454v94.8L143.8,589c8.9,35.8,23,69.4,41.6,100.2L121,814l67,67l123-66.2c30.8,18.6,64.5,32.6,100.3,41.5L454,990h94.8L589,856.2c35.8-8.9,69.4-23,100.2-41.6L814,879l67-67l-66.2-123.1c18.6-30.7,32.6-64.4,41.5-100.2L990,546z M500,745c-135.3,0-245-109.7-245-245c0-135.3,109.7-245,245-245s245,109.7,245,245C745,635.3,635.3,745,500,745z"></path></g></svg></button>';
        $(toolBar.lastChild).css('margin-top', '10px');
        $(toolBar.lastChild).css('opacity', '0.8');
        $(toolBar.lastChild).click(function () {
            ShowSetting();
        });
    }

    // 读取设置
    g_settings = GetSettings();

    // g_csrfToken
    if (g_pageType == PageType.Search) {
        $.get(location.href, function (data) {
            var matched = data.match(/token":"([a-z0-9]{32})/);
            if (matched.length > 0) {
                g_csrfToken = matched[1];
                DoLog(LogLevel.Info, 'Got g_csrfToken: ' + g_csrfToken);
            } else {
                DoLog(LogLevel.Error, 'Can not get g_csrfToken, so you can not add works to bookmark when sorting has enabled.');
            }
        });
    }

    // 排序、预览
    itv = setInterval(function () {
        var returnMap = Pages[g_pageType].ProcessPageElements();
        if (!returnMap.loadingComplete) {
            return;
        }

        DoLog(LogLevel.Info, 'Process page comlete, sorting and prevewing begin.');
        DoLog(LogLevel.Elements, returnMap);

        clearInterval(itv);

        if (g_settings.linkBlank) {
            $(returnMap.controlElements).find('a').attr('target', '_blank');
        }

        try {
            if (g_pageType == PageType.Artwork) {
                Pages[g_pageType].Work();
                if (g_settings.enablePreview) {
                    PixivPreview();
                }
            }
            else if (g_pageType == PageType.Search) {
                if (g_settings.enableSort) {
                    PixivSK(g_settings.enablePreview ? PixivPreview : null);
                } else if (g_settings.enablePreview) {
                    PixivPreview();
                }
            } else if (g_settings.enablePreview) {
                PixivPreview();
            }
        }
        catch (e) {
            DoLog(LogLevel.Error, 'Unknown error: ' + e);
        }
    }, 500);
}
loadInterval = setInterval(Load, 1000);
setInterval(function() {
    if (location.href != initialUrl) {
        initialUrl = location.href;
        clearInterval(loadInterval);
        clearInterval(itv);
        clearInterval(autoLoadInterval);
        autoLoadInterval = null;
        loadInterval = setInterval(Load, 1000);
    }
}, 1000);