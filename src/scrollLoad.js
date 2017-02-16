/**
 * 无限滚动的加载
 * v0.0.1
 * 
 */

// 独立的loading样式
const LOADEFFECT_STYLE = `<style id="scroll-load-effect">.scroll-load-cont{width:100%;text-align:center;font-size:0.5rem;padding:.2rem 0;}.scroll-load-effect{width:1rem;height:1rem;position:relative;margin:0 auto}.scroll-load-effect span{display:inline-block;width:.2rem;height:.2rem;border-radius:50%;background:#909090;position:absolute;-webkit-animation:load 1.04s ease infinite}@-webkit-keyframes load{0%{-webkit-transform:scale(1.2);opacity:1}100%{-webkit-transform:scale(.3);opacity:.5}}.scroll-load-effect span:nth-child(1){left:0;top:50%;margin-top:-.1rem;-webkit-animation-delay:.13s}.scroll-load-effect span:nth-child(2){left:.14rem;top:.14rem;-webkit-animation-delay:.26s}.scroll-load-effect span:nth-child(3){left:50%;top:0;margin-left:-.1rem;-webkit-animation-delay:.39s}.scroll-load-effect span:nth-child(4){top:.14rem;right:.14rem;-webkit-animation-delay:.52s}.scroll-load-effect span:nth-child(5){right:0;top:50%;margin-top:-.1rem;-webkit-animation-delay:.65s}.scroll-load-effect span:nth-child(6){right:.14rem;bottom:.14rem;-webkit-animation-delay:.78s}.scroll-load-effect span:nth-child(7){bottom:0;left:50%;margin-left:-.1rem;-webkit-animation-delay:.91s}.scroll-load-effect span:nth-child(8){bottom:.14rem;left:.14rem;-webkit-animation-delay:1.04s}</style>`
// html
const LOADEFFECT_TPL = `<div class="scroll-load-cont"><div class="scroll-load-effect"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>`

// 创建style
if (!document.getElementById('scroll-load-effect')) {
    $('head').append(LOADEFFECT_STYLE)
}


// new此对象创建实例
class ScrollLoad {
    constructor(opt) {
        opt.scrollContanier = $(opt.scrollContanier)
        if (opt.listContanier != undefined) {
            opt.listContanier = $(opt.listContanier)
        }

        // 默认参数
        const DEFAULT = {
            maxload: 1000, //最大条数
            perload: 27, //每次分页条数
            isloading: false, //加载等待
            iscomplate: false, //最后一页数据加载完成
            currentPage: 1, //当前页
            listContanier: opt.scrollContanier, //list容器，默认等于scroll容器
            scrollContanier: opt.scrollContanier,
            cache: true //默认开启页面缓存，记录数据以及滚动条位置
        }

        opt = $.extend({}, DEFAULT, opt)

        // 将opt参数解构给this
        for (let key in opt) {
            if (opt.hasOwnProperty(key)) {
                this[key] = opt[key]
            }
        }

        // 创建loading
        this.loadEffect = $(LOADEFFECT_TPL).appendTo(this.listContanier)

        // 调整最大页数
        if (this.perload > this.maxload) {
            this.perload = this.maxload
        }

        // 开启滚动监听
        this.scrollContanier.on('scroll', () => {
            this.scroll()
        });

        // 首次加载
        if (this.cache && history.state.data) {
            this.render(history.state.data)

        } else {
            this.ajax({
                currentPage: 1, //当前页
                perload: this.perload //每页条数
            }, (data) => {
                this._ajax(data)
            })
        }
    }

    _ajax(data) {
        if (data.length) {
            this.currentPage++;
            this.render(data)
            if (data.length < this.perload) {
                this.finish();
            }
        } else {
            this.finish();
        }
    }


    /**
     * 对数据进行缓存，返回页面时能记录render的数据以及滚动条位置
     * 
     * @param {Object} data
     * @returns {Object} newData
     * 
     * @memberOf ScrollLoad
     */
    _cache(data) {

        if (!this.cache) {
            return data
        }

        // 带有状态缓存的渲染
        let oldData = history.state.data || {}
        let ajaxData = data
        let oldLen = oldData.length
        let reData //返回出去供render使用
        // console.log('oldData', oldData);
        // console.log('ajaxData', res.DATA);

        // 记录滚动条位置
        if (!this._cache.run) {
            let onscroll = false
            this.scrollContanier.on('scroll click', function (e) {
                const saveScroll = () => {
                    let scrollTop = $(this).scrollTop()
                    let data = Object.assign(history.state, {
                        scrollTop: scrollTop
                    })
                    history.replaceState(data, '', '')
                }

                if (!onscroll) {
                    onscroll = true
                    setTimeout(() => {
                        onscroll = false
                        if (e.type === 'scroll') saveScroll();
                    }, 300)
                    if (e.type === 'click') saveScroll();
                }

            })
        }

        // 渲染老数据
        if (oldLen > 0 && !this._cache.run) {
            // 设置loader的当前页
            this.currentPage = history.state.currentPage

            // 渲染老数据
            console.info('load cache data');
            reData = oldData

        } else { //渲染新数据

            let saveData //需要保持的 老数据+新数据
            if (oldLen > 0) {
                saveData = Object.assign({}, oldData)
                // 因为key重复，所以用此方法，将ajaxdata的对象值都追加到newData上
                for (let i = 0; i < ajaxData.length; i++) {
                    saveData[oldLen] = ajaxData[i]
                    oldLen++
                }
                saveData.length = oldLen
            } else {
                saveData = ajaxData
            }

            // console.log('saveData', saveData);

            // 记录新数据
            history.replaceState({
                data: saveData,
                currentPage: this.currentPage,
                scrollTop: this.scrollContanier.scrollTop()
            }, "", "");

            // 渲染新的ajax数据
            console.info('load ajax data');
            reData = ajaxData
        }

        // 限制执行次数
        this._cache.run = true;
        return reData;
    }

    // 清空缓存的数据
    cleanCache() {
        history.replaceState({
            data: {},
            currentPage: 1,
            scrollTop: 0
        }, "", "");
    }

    // 滚动逻辑
    scroll() {
        // 如果正在加载，则退出
        if (this.isloading || this.iscomplate) return;

        // 滚动到接近底部时加载数据
        if (this.scrollContanier.scrollTop() + this.scrollContanier.height() + 100 < this.scrollContanier[0].scrollHeight) {
            return
        }

        // 超出最大限制
        if (this.listContanier.children().length >= this.maxload) {
            this.finish();
            return;
        }

        // 设置flag
        this.isloading = true;

        this.ajax({
            currentPage: this.currentPage, //当前页
            perload: this.perload //每页条数
        }, (data) => {
            // 重置加载flag
            this.isloading = false;

            this._ajax(data)

        })
    }

    // 刷新数据
    reload(reload_callback) {
        // 滚动条置顶
        this.scrollContanier[0].scrollTop = 0

        // 还原loading的效果
        this.loadEffect.replaceWith(LOADEFFECT_TPL)

        // 当前页从1开始
        this.currentPage = 1

        // 重置状态
        this.isloading = false
        this.iscomplate = false

        this.ajax({
            currentPage: 1, //当前页
            perload: this.perload //每页条数
        }, (data) => {
            this.listContanier.empty()
            this._ajax(data)
            reload_callback()
        })
    }

    // 加载完成
    finish() {
        // 设置状态 - 全部数据加载完成
        this.iscomplate = true

        // 内容出现混动条时，才会显示已经到底
        let h1 = this.loadEffect[0].offsetTop
        let h2 = this.listContanier.height() - parseInt(this.listContanier.css('padding-top'))
        if (h1 > h2 - 10) {
            this.loadEffect.text('已经到底了！');
        } else {
            this.loadEffect.text('');
        }

    }

    // 进行渲染
    render(data) {
        // 缓存过滤
        data = this._cache(data)

        // 根据每页条数限制data长度
        // 后台返回的数据，有可能超过自定分页长度
        // 缓存模式开启时，不限制。因为缓存功能会一次性加载多页数据
        if (this.perload < data.length && !this.cache) {
            data.length = this.perload
        }
        let html = this.template(data)

        // 添加新条目
        this.listContanier.append(html);

        // 将loader移动到列表末
        this.loadEffect.appendTo(this.listContanier)

        // 如果有缓存，还原滚动条高度
        if (this.cache) {
            this.scrollContanier.scrollTop(history.state.scrollTop);
        }

    }
}