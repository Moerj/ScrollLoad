#滚动加载

## 功能
- 自动滚动到底部加载数据
- 缓存数据以及滚动条位置

## 用法
```javascript
let loader = new ScrollLoad({

        scrollContanier: 'id | class | DomObj', //滚动父容器，!必须
        listContanier: 'id | class | DomObj', //列表容器，不传则默认为scrollContanier
        maxload: 1000, //最大条数
        perload: 27, //每次分页条数
        isloading: false, //加载等待
        currentPage: 1, //当前页
        cache: true //默认开启页面缓存，记录数据以及滚动条位置

        // 配置渲染模板
        template: (data) => {
            // data是ajax返回的数据
            // 你在这里自行将data数据解析并拼接成html片段，推荐用es6字符串模板
            // 例如
            let html = '';
            for (let i = 0; i < data.length; i++) {
                let d = data[i]
                html += `
                <a href="${$.getMovDetails(d.id)}" class="find-list external">
                    <div class="imgbox">
                        <img src="${d.poster}" alt="">
                        <div class="status">${$.getUpdateStatus(d.updateStatus,d.updateSite)}</div>
                    </div>
                    <p class="name">${d.title}</p>
                </a>
                `
            }
            // 最后把凭借的好html返回
            return html
        },

        ajax: (data, callback) => {
            //data是ajax请求前，scrollLoad返回出来的参数，可以让你获取需要的部分进行data的合并
            // callback是ajax请求成功后的回调，会触发模板的渲染，请将请求后的数据callback回去

            // 下面是例子
            // 合并入筛选参数
            data = $.extend({}, data, {
                sort: Number(sessionStorage.sort),
                first_type: sessionStorage.first_type,
                type: sessionStorage.type
            })

            $.ajax({
                url: 'http://www.funying.cn/wx/rest/find/all',
                data: data,
                success: function(res) {
                    console.log('发现', res);
                    if (res.DATA) {

                        callback(res.DATA)

                    } else {
                        $.alert('没有数据了')
                    }
                },
                error: function(e) {
                    console.log(e);
                    $.alert('刷新失败，请稍后再试！')
                }
            });
        }
    })

```