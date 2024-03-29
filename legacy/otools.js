(function umd(root, factory) {
    if ('function'===typeof define && define.amd) { // AMD
        define(['window', 'document'], factory);
    } else if ('object'===typeof module && module.exports) { // CommonJS
        module.exports = factory(require('window'), require('document'));
    } else { // Browser
        root.o = factory(root.window, root.document);
    }
}(this, function (w, d) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var tickData = {};
    function binder(obj, prop) {
        obj._o_ || Object.defineProperty(obj, '_o_', { value: {}, writable:true });
        var bindings = obj._o_[prop];
        if(!bindings) {
            var value = obj[prop];
            obj._o_[prop] = bindings = [];
            if(value instanceof Function) {
                throw TypeError('"'+value.name+'" is invalid type, expected value type');
            }
            prop && Object.defineProperty(obj, prop, {
                get: function () { return value },
                set: function (newValue) {
                    if (value === newValue) return;
                    value = newValue;
                    bindings.forEach(function (it) { it.set(value) });
                },
                enumerable: true
            });
        }
        return bindings;
    }

    function parseObjectKey(obj, prop) {
        var filters = prop.split('|').map(function (a) { return a.trim() });
        var attr = filters.shift();
        var attrs = attr.split('.');

        filters.forEach(function (each) { assert.function(w[each], each) });

        var source = obj;
        for(var i=0; i < attrs.length-1; ++i) {
            source = source[attrs[i]];
        }

        if (void 0 === source) throw TypeError('"'+prop+'" is invalid property.');

        return {
            source: source,
            prop: attrs[attrs.length-1],
            filter: filters.reduce.bind(filters, function (a, f) { return w[f](a) }),
            get: function () { return this.source[this.prop] },
            set: function (val) { return this.source[this.prop] = val }
        };
    }

    function popAttribute(node, attName) {
        var ret = node.getAttribute(attName);
        node.removeAttribute(attName);
        return ret;
    }

    function onInputNode(obj, node) {
        var model = popAttribute(node, 'o-model');
        var type = node.type && node.type.toLowerCase();

        function createHandler() {
            var parsedObj = parseObjectKey(obj, model);
            var bindings = binder(parsedObj.source, parsedObj.prop);
            var el = node;
            var action = {};

            if ('radio'===type) {
                action.set = function (val) { el.checked = el.value === parsedObj.filter(val).toString() };
            } else if ('checkbox'===type) {
                if(Array.isArray(parsedObj.get())) {
                    action.checkbox = el;
                    action.set = function (val) {
                        el.checked = val && ~parsedObj.filter(val).indexOf(el.value)
                    };
                    action.get = function () {
                        return bindings.reduce(function (a, b) {
                            b.checkbox && b.checkbox.checked && a.push(b.checkbox.value);
                            return a;
                        }, []);
                    };
                } else {
                    action.set = function (val) { el.checked = 'true' === parsedObj.filter(val).toString() };
                    action.get = function () { return el.checked };
                }
            } else if ('SELECT'===node.nodeName && node.multiple) {
                if(!Array.isArray(parsedObj.get())) {
                    throw TypeError('"'+parsedObject.prop+'" must be array to use a multiple select.');
                }

                action.set = function (val) {
                    var value = parsedObj.filter(val);
                    Array.prototype.forEach.call(el.options, function(it) {
                        it.selected = !!~value.indexOf(it.value);
                    });
                };
                action.get = function () { 
                    return Array.prototype.reduce.call(el.options, function(a, it) {
                        it.selected && a.push(it.value);
                        return a;
                    },[]);
                }; 
            }

            action.set = action.set || function (val) { el.value = parsedObj.filter(val) };
            action.get = action.get || function () { return el.value };
            bindings.push(action);
            action.set(parsedObj.get());

            return function() { parsedObj.set(action.get()) };
        }

        node._o_handler = createHandler();
    }

    function onForNode(obj, node) {
        var valFor = popAttribute(node, 'o-for');
        var valKey = popAttribute(node, 'o-key');

        if(!valKey) throw TypeError('key is not exist or empty. requied it.');

        var parent = node.parentElement;
        var template = node;
        parent.removeChild(node);
        
        var props = valFor.split('.');
        var source = obj;
        for(var i=0; i < props.length; ++i) {
            source = source[props[i]];
        }

        if (!(source instanceof Array)) {
            throw TypeError('"'+valFor+'" is invalid type. expected array type.');
        }

        var binding = binder(source);
        wrapper(source, 'push', function (val) {
            var key = val[valKey];
            if (!key) throw TypeError('key is not exist in array.');
            appendItem(val);
            source._push(val);
        });

        wrapper(source, 'pop', function () {
            deleteItem(source[source.length-1]);
            source._pop();
        });

        wrapper(source, 'splice', function (start, deleteCount) {
            if (0 > start) start = Math.max(source.length + start, 0);
            var n = Math.min(start + (deleteCount || source.length), source.length);
            for(var i=start; i<n; ++i) {
                deleteItem(source[i]);
            }
            source._splice(start, deleteCount);
        });

        wrapper(source, 'sort', function() {
            source._sort.apply(source, arguments);
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
            parent.append.apply(parent, source.map(function (each) {
                return binding[each[valKey]];
            }));
        });

        function appendItem(item) {
            var clone = template.cloneNode(true);
            parent.appendChild(clone);
            binding[item[valKey]] = clone;
            this.o.bindOf(item, clone);
        }

        function deleteItem(item) {
            var key = item[valKey];
            var bindedNode = binding[key];
            bindedNode && parent.removeChild(bindedNode);
            delete binding[key];
        }

        source.forEach(function (item) { appendItem(item) });
    }

    function wrapper(source, attr, fn) {
        source['_'+attr] = source[attr];
        source[attr] = fn;
    }

    var preRe = /{{([\w\d\s$_|\.]+?)}}/g;
    var postRe = /{{([\w\d$_]+?)}}/g;
    function doTextReplacer(obj, text, factorySet) {
        var mappings = [];
        var nomarizedText = text.replace(preRe, function (m, k) {
            var parsedObj = parseObjectKey(obj, k);
            mappings.push(parsedObj);
            return '{{'+parsedObj.prop+'}}';
        });

        mappings.forEach(function(it) {
            var txt = nomarizedText;
            function get() {
                return txt.replace(postRe, function(m, k) {
                    return it.source.hasOwnProperty(k) ? it.filter(it.source[k]) : void 0;
                });
            }

            var action = { set: factorySet(get) };
            binder(it.source, it.prop).push(action);
            action.set();
        });
    }
    
    function onTextNode(obj, node) {
        node.textContent && doTextReplacer(obj, node.textContent, function(get) {
            var el = node;
            return function() { el.textContent = get() };
        });
    }

    function onDatasetNode(obj, node)  {
        var dataset = node.dataset;
        Object.keys(dataset).forEach(function (key) {
            doTextReplacer(obj, dataset[key], function(get) {
                return function() { dataset[key] = get() };
            });
        });
    }

    function mixinObject () {
        this.on = this.addEventListener;
        this.off = this.removeEventListener;
        return this;
    }

    function mixinHttpResponse () {
        var text = this.bodyText;
        this.json = cached( function () { return JSON.parse(text) } );
        this.xml = cached( function () { return str2dom(text) } );
    }

    function cached (fn) {
        var cache = Object.create(null);
        return function cachedFn(arg) {
            var hit = cache[arg];
            return hit || (cache[arg] = fn(arg));
        };
    }

    function mixin (target) {
        for(var i=1; i<arguments.length; ++i) {
            var arg = arguments[i];
            if(arg instanceof Function) {
                arg.call(target);
            } else {
                assign(target.prototype, arg);
            }
        }
        return target;
    }

    function assign (target, source, deep) {
        var target_ = target || {};
        for (var key in source) {
            var src = source[key];
            target_[key] = (deep && src instanceof Object) ? assign(target_[key], src) : src;
        }
        return target_;
    }

    function str2dom (text) {
        var res = new DOMParser().parseFromString(text, 'text/xml');
        return res.firstChild;
    }

    function Next(handler) {
        assert.function(handler, 'handler');

        this.fulfillHandlers = [];
        this.rejectHandlers = [];
        this.hasResponse = false;
        this.occureError = false;
        try {
            handler(this.onFullfill.bind(this), this.onReject.bind(this));
        } catch(ex) {
            this.onReject(ex);
        }
    }
    
    function assert(condition, message) {
        if (!condition) {
            throw Error(message || 'assertion failed');
        }
    }
    
    assert.function = function(obj, name) {
        if (!(obj instanceof Function)) {
            throw TypeError(`${name || 'it'} must be a function`);
        }
    }
    
    assert.string = function(obj, name) {
        if (!(obj instanceof String || 'string' === typeof obj)) {
            throw TypeError(`${name || 'it'} must be a string`);
        }
    }

    mixin(Next, {
        onFullfill: function (response)  {
            if (this.hasResponse || this.occureError) return;
            this.hasResponse = true;
            this.response = response;
            this.callFullfillHandler(response);
        },
        callFullfillHandler: function(response) {
            try {
                var res = response;
                this.fulfillHandlers.forEach(function(each, idx) {
                    res = each(res);
                });
            } catch (ex) {
                this.onReject(ex);
            }
        },
        then: function (handler) {
            this.fulfillHandlers.push(handler);
            if (this.hasResponse) {
                var response = this.response;
                this.response = null;
                this.callFullfillHandler(response);
            }
            return  this;
        },
        onReject: function(error) { 
            if (this.occureError) return;
            this.occureError = true;
            this.error = error;
            this.callRejectHandlers(error);
        },
        callRejectHandlers: function (error) {
            var err = error;
            this.rejectHandlers.forEach(function(each, idx) {
                err = each(err);
            });
        },
        catch: function (handler) {
            this.rejectHandlers.push(handler);
            if (this.occureError) {
                var error = this.error;
                this.error = null;
                this.callRejectHandlers(error);
            }
            return this;
        }
    });

    function HttpResponse(xhr) {
        this.status = xhr.status;
        this.statusText = xhr.statusText;
        this.body = xhr.response;
        this.bodyText = xhr.responseText;
        var headers = this.headers = {};
        xhr.getAllResponseHeaders().split('\r\n').forEach(function(each) {
            var p = each.indexOf(':');
            ~p && (headers[each.substring(0, p).trim()] = each.substring(p+1).trim());
        });
    }

    function newFunction(str) {
        return new Function('with(this){return '+str+'}');
    }

    function convertToFormData (formData, key, value) {
        if (Array.isArray(value)) {
            for(var i=0; i<value.length; ++i) {
                convertToFormData(formData, key+'['+i+']', value[i])
            }
        } else if ('object' === typeof value) {
            for (var k in value) {
                convertToFormData (formData, key+'.'+k, value[k]);
            }
        } else {
            formData.append(key, value);
        }
    }

    return {
        assert: assert,
        getById: d.getElementById.bind(d),
        find: function (selector, el) {
            return (el || d).querySelector(selector);
        },
        findAll: function (selector, el) {
            return this.toArray((el || d).querySelectorAll(selector));
        },
        findAllByClass: function(className, el) {
            return this.toArray((el || d).getElementsByClassName(className));
        },
        findAllByTag: function(tagName, el) {
            return this.toArray((el || d).getElementsByTagName(tagName));
        },
        findParent: function (el, compare) {
            if (!(el&&compare)) return undefined;
            if ('string' === typeof compare) {
                var nodeName = compare.toUpperCase();
                compare = function(node) { return node.nodeName === nodeName };
            }
            
            do {
                if (compare(el)) return el;
                el = el.parentElement || el.parentNode;
            } while(el && 1===el.nodeType);
            return null;
        },
        toArray: function (obj) {
            return Array.prototype.slice.call(obj);
        },
        assign: assign,
        tag2dom: function (tagName, attributes) {
            var obj = this.assign(d.createElement(tagName), attributes);
            mixinObject.call(obj);
            return obj;
        },
        str2dom: str2dom,
        dom2str: function (el) {
            // TODO outerHTML
            var div = d.createElement('div');
            div.appendChild(el.parentElement ? el.cloneNode(true) : el);
            return div.innerHTML;
        },
        on: function(elem, type, selector, listener, options) {
            if(!(elem && type)) return;
            if (selector instanceof Function) {
                options = listener;
                listener = selector;
                selector = null;
            }
            if (!(listener instanceof Function)) {
                throw TypeError('listener must be function');
            }
            elem.addEventListener(type, selector ? function (ev) {
                ev.target.matches(selector) && listener.call(ev.target, ev);
            } : function(ev) {
                listener.call(ev.target, ev);
            }, options);
        },
        off: function(elem, type, listener, options) {
            if(!(elem && type)) return;
            if (!(listener instanceof Function)) {
                throw TypeError('listener must be function');
            }
            elem.removeEventListener(elem, type, listener, options);
        },
        redirectForm: function (url, data) {
            var form = this.createTag('form', {method: 'post', action: url});
            for (var key in data) {
                form.append(this.createTag('input', {type: 'hidden', name: key, value: data[key]}));
            }
            d.body.append(form);
            form.submit();
        },
        redirect: function (url) {
            window.location.href = url;
        },
        redirectWithoutHistory: function (url) {
            window.location.repalce(url);
        },
        arrayIndex: function(array, compare) {
            if ('string' === typeof compare) {
                var keyword = compare;
                compare = function(val) { return val === keyword };
            } else {
                assert.function(compare, 'compare');
            }
            for(var i=0; i<array.length; ++i) {
                if (compare(array[i])) return i;
            }
            return -1;
        },
        ajax: function (opts, data) {
            opts = assign({method: 'GET', responseType:'', headers:{}}, opts, true);
            data = data || opts.data;
            
            return new Next(function(resolve, reject) {
                try {
                    var xhr = new XMLHttpRequest();
                    opts.responseType  && (xhr.responseType = opts.responseType);
               
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === XMLHttpRequest.DONE) {
                            var res = new HttpResponse(xhr);
                            mixinHttpResponse.call(res);
                            resolve(res);
                        }
                    };
                    xhr.open(opts.method, opts.url, true);
                    for(var key in opts.headers) {
                        xhr.setRequestHeader(key, opts.headers[key]);
                    }
                    xhr.send(data);
                } catch(ex) {
                    reject(ex);
                }
            });
        },
        toQueryString: function (obj, enableT) {
            var data = [];
            for(var key in obj) {
                data.push(key.concat('=').concat(encodeURIComponent(obj[key])));
            }
            if(enableT) data.push('t='.concat(new Date().getTime()));
            
            return data.join('&');
        },
        parseQueryString: function (str) {
            var ret = {};
            var tokens = str.split('&');
            for(var i=0; i<tokens.length; ++i) {
                var items = tokens[i].split('=');
                ret[item[0]] = item[1] && decodeURIComponent(item[1]);
            }
            return ret;
        },
        ajaxJson: function (opts, data) {
            opts = assign({method: 'GET'},  opts, true);
            opts.url = opts.url+'?'+this.toQueryString(queryData, true);
            opts.headers = assign(opts.headers || {}, {'Content-Type':'application/json;charset=UTF-8'});

            var queryData = null;
            if (data && ('GET'===opts.method || 'DELETE'===opts.method)) {
                queryData = data;
                data = null;
            }
            
            return this.ajax(opts, data&&JSON.stringify(data)).then(function(res) { return res.json() });
        },
        getJson: function (url, data) {
            return this.ajaxJson({url:url, method:'GET'}, data);
        },
        postJson: function (url, data) {
            return this.ajaxJson({url:url, method:'POST'}, data);
        },
        putJson: function (url, data) {
            return this.ajaxJson({url:url, method:'PUT'}, data);
        },
        deleteJson: function (url, data) {
            return this.ajaxJson({url:url, method:'DELETE'}, data);
        },
        postForm: function (url, formData) {
            formData = this.convertToFormData(formData);
            return this.ajax({url:url+'?'+this.toQueryString(null, true), method:'POST'}, formData)
                .then(function (res) { return res.json() });
        },
        postMultipart: function (url, formData) {
            //TODO xhr.upload.onprogress 추가
            formData = this.convertToFormData(formData);
            return this.ajax({url: url, method: 'POST', headers: {'Content-Type':'multipart/form-data'}}, formData);
        },
        convertToFormData: function (data) {
            if (!data || ~data.toString().lastIndexOf('FormData')) return data;

            var ret = new FormData();
            for (var key in data) {
                convertToFormData(ret, key, data[key]);
            }
            return ret;
        },
        readFile: function (file) {
            return new Next(function(resolve, reject) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    resolve(ev.target.result);
                };
                reader.onerror = function(err) {
                    reject(err);
                };
                reader.readAsBinaryString(file);
            });
        },
        decodeHTML: function (str) {
            return str && str.replace(/%lt;/g, '<').replace(/&gt;/g, '>');
        },
        formatNumber: function (num){
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },
        formatBytes: function (value, digits){
            if (!value) return '0 B';
            var units=['B', 'KB','MB','GB','TB','PB','EB','ZB','YB'];
            var exp = Math.floor(Math.log(value)/Math.log(1024));
            return (value/Math.pow(1024, exp)).toFixed(digits).concat(' ').concat(units[exp]);
        },
        isNumber: function (str){
            var re =  /^[0-9]+$/ ;
            return re.test(str);
        },
        isEmail: function (str){
            var re = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/ ;
        
            return re.test(str);
        },
        sprint: function (fmt) {
            var args = arguments;
            return fmt.replace(/{(\d+)}/g, function(match, value) {
                return void 0 !== args[value] ? args[value] : match;
            });
        },
        randomRange: function (min, max) {
            return min + Math.floor(Math.random()*(max-min+1));
        },
        round: function (value, decimal) {
            var fix = Math.pow(10, decimal);
            return Math.round(value*fix)/fix;
        },
        replaceAll: function (str, context) {
            if ('string' === typeof contenxt) {
                return str.replace(context);
            }
            if(content instanceof Object) {
                return str.replace(/\{(\w+)\}/g, function(match, key) {
                    return context.hasOwnProperty(key) ? context[key] : match;
                });
            }
        },
        /*
          sub는 base를 상속하도록 연결함. sub 생성자에서 base을 생성자를 명시적으로 호출 필요.
          권장하는 방식으로 OOP에서도 부모 생성자를 명시적으로 호출이 필요함.
          function P(opts) {}
          function C(opts) {
              P.call(this, opts);
          }
          extend(C, P);
         */
        extend: function (sub, base) {
            sub.prototype = Object.assign(Object.create(base.prototype), sub.prototype);
            sub.prototype.constructor = sub;
            sub.base = base;
            return sub;
        },
        extendDefault: function  (sub, base) {
            sub.prototype = Object.assign(new base(), sub.prototype);
            sub.prototype.constructor = sub;
            sub.base = base;
            return sub;
        },
        mixin: mixin,
        cached: cached,
        once: function (fn) {
            var called = false;
            return function() {
                if (called) return;
                fn.apply(fn, arguments);
            };
        },
        camelize: cached (function(str) {
            var camelizeRE = /-(\w)/g;
            return str && str.replace(camelizeRE, function(_, c) {
                return c ? c.toUpperCase() : '';
            });
        }),
        hyphenate: cached (function(str) {
            var hyphenateRE = /\B([A-Z])/g;
            return str && str.replace(hyphenateRE, '-$1').toLowerCase();
        }),
        capitalize: cached (function(str) {
            return str && str.charAt(0).toUpperCase().concat(str.slice(1));
        }),
        watch: function (obj, key, callback) {
            assert.function(callback, 'callback');

            var value = obj[key];
            Object.defineProperty(obj, key, {
                set: function (val) {
                    value = val;
                    callback(val);
                },
                get: function () {
                    return value;
                }
            });
        },
        getForm: function (elem) {
            var ret = {};
            elem && elem.querySelectorAll('input,select,textarea').forEach(function(each) {
                var name = each.name && each.name.trim();
                if(!name) return;
                
                switch(each.tagName) {
                case 'INPUT': case 'TEXTAREA':
                    switch(each.type) {
                    case 'checkbox': case 'radio': each.checked && (ret[name] = each.value); break;
                    case 'file': each.files.length && (ret[name] = each.files); break;
                    case 'button': case 'submit': case 'reset': break;
                    default: each.value && (ret[name] = each.value); break;
                    }
                    break;
                case 'SELECT':
                    var val = each.querySelector('option:checked').value;
                    val && (ret[name] = val);
                    break;
                }
            });

            return ret;
        },
        setForm: function (elem, obj) {
            elem && elem.querySelectorAll('input,select,textarea').forEach(function(node) {
                var name = node.name && node.name.trim();
                if(!name) return;
                switch(node.tagName) {
                case 'INPUT': case 'TEXTAREA':
                    switch(node.type) {
                    case 'checkbox': case 'radio': node.checked = node.value === obj[name].toString(); break;
                    case 'button': case 'submit': case 'reset': case 'file': break;
                    default: node.value  = obj[name]; break;
                    }
                    break;
                case 'SELECT':
                    Array.prototype.forEach(node.options, function(opt) {
                        opt.checked = opt.value === obj[name];
                    });
                    break;
                }
            });
        },
        iterateNode: function (node, visitor) {
            assert.function(visitor, 'visitor');

            if(!node) return;

            var visited = this.now();
            var waits = [node.firstChild];
            var node;
            while(0 < waits.length) {
                while(node = waits[waits.length-1]) {
                    if (node._o_visited === visited) {
                        throw Error('loopping in the dom tree: '+node.localname+'('+node.className+')');
                    }
                    node._o_visited === visited;
                    waits[waits.length-1]=node.nextSibling;
                    if (false === visitor(node)) break;
                    node.firstChild && waits.push(node.firstChild);
                }
                waits.pop();
            }
        },
        evalInContext: function (str, ctx) {
            return newFunction(str).call(ctx);
        },
        now: w.performance && w.performance.timing && w.performance.now && w.performance.timing.navigationStart ?
            function () {
                return w.performance.timing.navigationStart + w.performance.now();
            } : function () {
                return (new Date()).getTime();
            },
        tick: function(id) {
            var t = this.now();
            tickData[id] = tickData[id] || [];
            tickData[id].push(t);

        },
        getTick: function(id) {
            return tickData[id];
        },
        resetTick: function(id) {
            delete tickData[id];
        },
        changeAttribute: function (dom, name, callback) {
            assert.function(callback, 'callback');
            
            if (!dom) return;
            var observer = new MutationObserver(function(targets) {
                for(var i=0; i<targets.length; ++i) {
                    var target = targets[i];
                    if('attributes' === target.type && name === target.attributeName) {
                        callback(target.target);
                        break;
                    }
                }
            });
            observer.observe(dom, {attributes: true});
        },
        changeDom: function (dom, callback) {
            assert.function(callback, 'callback');
            
            if (!dom) return;
            var observer = new MutationObserver( function (objects) {
                for(var i=0; i<objects.length; ++i) {
                    var obj = objects[i];
                    callback(obj.addedNodes);
                }
            });
            // childList:true로 변경사항 감지.
            // 자식 변경은 감지못함(subtree:true로 설정해야 가능)
            observer.observe(dom, { childList:true });
        },
        bindOf: function (obj, elem) {
            if (!(obj && elem)) return;
        
            elem.addEventListener('change', function(ev) {
                ev.target._o_handler && ev.target._o_handler();
            });
            
            this.iterateNode(elem, function(node) {
                if (1===node.nodeType) {
                    if (node.hasAttribute('o-model')) {
                        if (!!~'INPUT SELECT TEXTAREA'.indexOf(node.tagName)) {
                            onInputNode(obj, node);
                        }
                    } else if (node.hasAttribute('o-for')) {
                        onForNode(obj, node);
                        return false;
                    }
                    onDatasetNode(obj, node);
                } else if (3===node.nodeType) {
                    onTextNode(obj, node);
                }
            });
        }
    };
}));
