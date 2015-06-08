/*
	version 1.0.0
	depend on jquery(测试用1.8.3)

	TableTree
	CheckBoxTableTree


	data : [{
		'id': 'id2',
		'pid': '0',
		'name': '总行2',
		'isParent': false,
		'attr': {
			'code': '123',
			'type': '总行',
			'status': '激活'
		},
		'children': []
	}]
 
 
	option : {
		['ajaxURL' : string]//发送ajax获取下一层数据的url，若为undefined/null 则不发送ajax请求
		'thKey' : array		//table中column所对应的key，按照数组中key顺序显示列
		'data' : array 		//需要显示的数据数组，data数据结构如上显示
		'tableArea' : object//table的jQuery对象
	}
 */

/*
 *@description 生成树形结构的table(仅tbody内的tr部分)
 *@param {object} 生成树所需要的参数
 */
function TableTree(option){
	this.ajaxURL = option.ajaxURL;
	this.setting = {
		'doneFlag' : ['t', 'f', 'n'],
		'foldFlag' : ['t', 'f', 'n'],
		'foldClass' : ['tt-fold', 'tt-unfold'],
		'txtClass' : 'tt-txt',
		'pdLeftBase' : 16,
	};
	//this.thName = option.thName;
	this.thKey = option.thKey;
	this.initData = option.data;
	this.dataCache = {};
	this.selectedId = '';
	//this.tableArea = option.tableArea;
	this.tableEl = option.tableArea;

	//改为外部调用(由于继承方式原因)
	//this.init.call(this, option.data);
}

TableTree.prototype = {

	"constructor" : TableTree,

	/*
	 *@description 初始化TableTree
	 *@return {undefined}
	 */
	"init" : function(){
		var data = this.initData;
		if(!data || data.constructor != Array){
			return false;
		}
		this.addDataCache(data, 0);
		//var table = this.initTable();
		//this.tableEl = table;
		this.tableEl.find('tbody').append(this.getTrHtml(data));
		//this.tableArea.append(table);
		this.showRoot();
		this.bindEvent();
	},

	/*
	 *@description 绑定相应事件
	 *@return {undefined}
	 */
	"bindEvent" : function(){
		this.bindFoldClick();
	},

	/*
	 *@description 将数据加工后以id:object的形式存入this.dataCache
	 *@param data {array} 树形结构的原始数据
	 *@param n {number} data中第一层数据在所有数据中的层数
	 *@return {boolean}
	 */
	"addDataCache" : function(data, n){
		var i = 0,
			_dataCache = this.dataCache,
			_data,
			_doneFlag = this.setting.doneFlag,
			_foldFlag = this.setting.foldFlag;
    	
    	i = data.length;

    	while(i){
			_data = data[--i];
			_data.isDone = _data.isParent ? _doneFlag[1] : _doneFlag[2];
			_data.isFold = _data.isParent ? _foldFlag[0] : _foldFlag[2];
			_data.layer = n;
    		_dataCache[_data.id] = _data;
			if(_data.children.length){
				_data.isDone = _doneFlag[0];
				this.addDataCache.call(this, _data.children, n + 1);
			}
    	}
		return true;
	},

	/*
	 *然而并没有什么×用
	 */
	"initTable" : function(){
		var html = ['<table><thead><tr>'],
			_thName = this.thName;

		for(var i = 0, len = _thName.length; i < len; i++){
			html.push('<td>' + _thName[i] + '</td>');
		}
		html.push('</tr></thead><tbody></tbody></table>');
		return $(html.join(''));
	},

	/*
	 *@description 通过data生成html字符串
	 *@param data {array} 加工后的数据，根据数据中的属性生成tr
	 *@return {string} 生成的html
	 */
	"getTrHtml" : function(data){
		if(!data || data.constructor != Array){
			return '';
		}

		var html = [],
			_setting = this.setting,
			paddingLeft = _setting.pdLeftBase * data[0].layer,
			_thKey = this.thKey,
			_foldClassTrue = _setting.foldClass[0],
			_txtClass = _setting.txtClass;

		for(var j = 0, len = data.length; j < len; j++){
			var row = data[j],
				cData = row.attr,
				str = '<tr data-id="' + row.id + '"><td style="padding-left:'
					+ paddingLeft + 'px;"><span class="'
					+ (row.isParent ? _foldClassTrue : '') + '"></span><div class="'
					+ _txtClass + '">' + cData[_thKey[0]] + '</div></td>';

			for(var i = 1, cLen = _thKey.length; i < cLen; i++){
				str += '<td>' + cData[_thKey[i]] + '</td>';
			}
			str += '</tr>';
			html.push(str);
			if(row.children.length){
				html.push(this.getTrHtml.call(this, row.children));
			}
		}
		
		return html.join('');
	},

	/*
	 *@description 获取下一层数据的ajax成功返回数据后执行的操作
	 *					1.将data加工然后存入dataCache
	 *					2.生成新数据的html并展示在页面上
	 *@param data {array} 新增的数据
	 *@return {undefined}
	 */
	"ajaxCallback" : function(data){
		var _dataCache = this.dataCache,
			_selectedId = this.selectedId,
			_selectedRow = this.dataCache[_selectedId],
			_layer = _selectedRow.layer + 1;

		this.addDataCache(data, _layer);
		//将新增数据push入相应的父级children中
		for(var i = 0, len = data.length, row; i < len; i++){
			row = data[i];

			_dataCache[row.pid].children.push(row);
		}
		this.tableEl.find('tr[data-id=' + _selectedId + ']').after(this.getTrHtml.call(this, data));
		this.toggle(_selectedId);
	},

	/*
	 *@description 绑定展开/收起及节点事件
	 *@return {undefined}
	 */
	"bindFoldClick" : function(){
		var _this = this;

		_this.tableEl.on('click', 'span', function(){
			var id = $(this).parent().parent().attr('data-id'),
				obj = _this.dataCache[id],
				isDone = obj.isDone,
				_doneFlag = _this.setting.doneFlag;

			_this.selectedId = id;
			if(isDone === _doneFlag[1] && _this.ajaxURL){
				$.ajax({
					type : 'POST',
					url : _this.ajaxURL,
					data : {pid : id},
					dataType : 'JSON',
					success : function(result){
						if(result.code === '0'){
							_this.ajaxCallback(result.data);
							obj.isDone = _doneFlag[0];
						}
					}
				});
			}else if(isDone === _doneFlag[0]){
				_this.toggle(id);
			}
		});
	},

	/*
	 *@description 展开/收起指定id的节点
	 *@param pid {string} 指定节点的id
	 *@return {undefined}
	 */
	"toggle" : function(pid){
		var _foldFlagTrue = this.setting.foldFlag[0],
			isFold = this.dataCache[pid].isFold !== _foldFlagTrue;

		this.fold(pid, isFold);
	},

	/*
	 *@description 展开/收起指定id的节点
	 *@param pid {string} 指定节点的id
	 *@param flag {boolean} 指示展开还是收起{true : 展开, false : 收起}
	 *@return {undefined}
	 */
	"fold" : function(pid, flag){
		var _tableEl = this.tableEl,
			_thisRow = this.dataCache[pid],
			_foldFlag = this.setting.foldFlag,
			_foldClass = this.setting.foldClass,
			children = _thisRow.children,
			len = children.length,
			cRow, cId, cEl,
			display, aClass, rClass , isFold;

		if(flag){
			display = 'none';
			aClass = _foldClass[0];
			rClass = _foldClass[1];
			isFold = _foldFlag[0];
		}else{
			display = 'table-row';
			aClass = _foldClass[1];
			rClass = _foldClass[0];
			isFold = _foldFlag[1];
		}
		_thisRow.isFold = isFold;
		_tableEl.find('tr[data-id=' + pid + ']').find('span').removeClass(rClass).addClass(aClass);
		while(len){
			cRow = children[--len],
			cId = cRow.id,
			cEl = _tableEl.find('tr[data-id=' + cId + ']');
			cEl.css('display', display);
			if(cRow.isParent && flag && cRow.children.length){
				this.fold.call(this, cId, true);
			}
		}
	},

	/*
	 *@description 设置根节点为可见(display:table-row)，默认所有tr为不可见(display:none)
	 */
	"showRoot" : function(){
		var _tableEl = this.tableEl,
			_dataCache = this.dataCache,
			row;

		for(var key in _dataCache){
			row = _dataCache[key];
			if(row.layer === 0){
				_tableEl.find('tr[data-id=' + row.id + ']').css('display', 'table-row');
			}
		}
	},

	/*
	 *@description 仅移除指定节点(不移除其子节点)
	 *@param {string} 指定节点的id
	 *@return {boolean}
	 */
	"removeSingle" : function(id){
		var _dataCache = this.dataCache,
			_tr = _dataCache[id],
			_parent = _dataCache[_tr.pid],
			_sibling = _parent ? _parent.children : [];

		this.tableEl.find('tr[data-id=' + id + ']').remove();
		//delete from dataCache
		delete _dataCache[id];
		//delete from parent.children
		for(var i = 0, len = _sibling.length, childId; i < len; i++){
			childId = _sibling[i].id;
			if(childId === id){
				_sibling.splice(i, 1);
				return true;
			}
		}
	},

	/*
	 *@description 移除指定节点(包括其子节点)
	 *@param {string} 指定节点的id
	 *@return {undefined}
	 */
	"remove" : function(id){
		var _dataCache = this.dataCache,
			_tr = _dataCache[id],
			_children = _tr.children;

		this.removeSingle(id);
		for(var i = 0, len = _children.length, child; i < len; i++){
			child = _children[i];
			this.remove.call(this, child.id);
		}
	}
};

/*
 *@description 生成带checkbox的TableTree(继承于TableTree)
 *@param {object} 生成树所需要的参数
 */
function CheckBoxTableTree(option){
	this._inherit(TableTree, option);
	this.setting.checkedFlag = ['t', 'f'];
}

CheckBoxTableTree.prototype = {

	"constructor" : CheckBoxTableTree,

	/*
	 *@description 继承指定的function
	 *@param parent {function} 父类
	 *@param option {object} 生成树所需要的参数
	 *@return {undefined}
	 */
	"_inherit" : function(parent, option){
		var pFn = parent.prototype,
			_fn = this.constructor.prototype;
		for(key in pFn){
			!_fn[key] && (_fn[key] = pFn[key]);
		}
		parent.call(this, option);
	},

	/*
	 *@description 绑定相应事件
	 *@return {undefined}
	 */
	"bindEvent" : function(){
		this.bindFoldClick();
		this.bindCheckboxClick();
	},

	/*
	 *@description 通过data生成html字符串
	 *@param data {array} 加工后的数据，根据数据中的属性生成tr
	 *@return {string} 生成的html
	 */
	"getTrHtml" : function(data){
		if(!data || data.constructor != Array){
				return '';
			}

			var html = [],
				_setting = this.setting,
				paddingLeft = _setting.pdLeftBase * data[0].layer,
				_thKey = this.thKey,
				_foldClassTrue = _setting.foldClass[0],
				_txtClass = _setting.txtClass;

			for(var j = 0, len = data.length; j < len; j++){
				var row = data[j],
					cData = row.attr,
					str = '<tr data-id="' + row.id + '"><td style="padding-left:'
						+ paddingLeft + 'px;"><span class="'
						+ (row.isParent ? _foldClassTrue : '') + '"></span><input type="checkbox"/><div class="'
						+ _txtClass + '">' + cData[_thKey[0]] + '</div></td>';

				for(var i = 1, cLen = _thKey.length; i < cLen; i++){
					str += '<td>' + cData[_thKey[i]] + '</td>';
				}
				str += '</tr>';
				html.push(str);
				if(row.children.length){
					html.push(this.getTrHtml.call(this, row.children));
				}
			}
			
			return html.join('');
	},

	/*
	 *@description 将数据加工后以id:object的形式存入this.dataCache
	 *@param data {array} 树形结构的原始数据
	 *@param n {number} data中第一层数据在所有数据中的层数
	 *@return {boolean}
	 */
	"addDataCache" : function(data, n){
		var i = 0,
			_dataCache = this.dataCache,
			_setting = this.setting,
			_data,
			_doneFlag = _setting.doneFlag,
			_foldFlag = _setting.foldFlag,
			_checkedFlag = _setting.checkedFlag;
		
		i = data.length;

		while(i){
			_data = data[--i];
			_data.isDone = _data.isParent ? _doneFlag[1] : _doneFlag[2];
			_data.isFold = _data.isParent ? _foldFlag[0] : _foldFlag[2];
			_data.isChecked = _checkedFlag[1];
			_data.layer = n;
			_dataCache[_data.id] = _data;
			if(_data.children.length){
				_data.isDone = _doneFlag[0];
				this.addDataCache.call(this, _data.children, n + 1);
			}
		}
		return true;
	},

	/*
	 *@description 绑定checkbox点击事件
	 *@return {undefined}
	 */
	"bindCheckboxClick" : function(){
		var _this = this;
		_this.tableEl.on('click', 'input[type=checkbox]', function(){
			var id = $(this).parent().parent().attr('data-id'),
				flag = this.checked;

			_this.select(id, flag);
		});
	},

	/*
	 *@description 仅[取消]选中指定节点的checkbox(不包含其父/子节点)
	 *@param id {string} 指定节点的id
	 *@param flag {boolean} 指示选中还是取消 {true : 选中, false : 取消}
	 *@return {undefined}
	 */
	"selectSingle" : function(id, flag){
		var _tableEl = this.tableEl,
			_dataCache = this.dataCache,
			_checkedFlag = this.setting.checkedFlag;

		_dataCache[id].isChecked = _checkedFlag[flag ? 0 : 1];
		_tableEl.find('tr[data-id=' + id + ']').find('input[type=checkbox]')[0].checked = flag;
	},

	/*
	 *@description [取消]选中指定节点的checkbox(包含其父/子节点)
	 *@param id {string} 指定节点的id
	 *@param flag {boolean} 指示选中还是取消 {true : 选中, false : 取消}
	 *@return {undefined}
	 */
	"select" : function(id, flag){
		this.selectParent(id, flag);
		this.selectChildren(id, flag);
	},

	/*
	 *@description [取消]选中指定节点的父节点checkbox
	 *@param id {string} 指定节点的id
	 *@param flag {boolean} 指示选中还是取消 {true : 选中, false : 取消}
	 *@return {undefined}
	 */
	"selectParent" : function(id, flag){
		var _dataCache = this.dataCache,
			tr = _dataCache[id],
			_parent = _dataCache[tr.pid],
			_checkedFlagTrue = this.setting.checkedFlag[0],
			_sibling;

		this.selectSingle(tr.id, flag);
		if(_parent){
			if(!flag){
				_sibling = _parent.children;
				for(var i = 0, len = _sibling.length; i < len; i++){
					if(_sibling[i].isChecked == _checkedFlagTrue){
						return;
					}
				}
			}
			this.selectParent.call(this, _parent.id, flag);
		}
	},

	/*
	 *@description [取消]选中指定节点的子节点checkbox
	 *@param id {string} 指定节点的id
	 *@param flag {boolean} 指示选中还是取消 {true : 选中, false : 取消}
	 *@return {undefined}
	 */
	"selectChildren" : function(id, flag){
		var _dataCache = this.dataCache,
			tr = _dataCache[id],
			_children = tr.children;

		for(var i = 0, len = _children.length, row; i < len; i++){
			row = _children[i];
			this.selectSingle(row.id, flag);
			row.children.length && this.selectChildren.call(this, row.id, flag);
		}
	},

	/*
	 *@description 获取选中节点的id数组
	 *@param sign {number} 指示只取叶子节点还是全部节点{0/undefined : 全部节点, 1 : 仅叶子节点}
	 *@return {array} 选中节点的数组
	 */
	"getSelected" : function(sign){
		var sign = sign || 0,
			idArray = [],
			_dataCache = this.dataCache,
			_checkedFlagTrue = this.setting.checkedFlag[0],
			row;
		for(key in _dataCache){
			row = _dataCache[key];
			if(sign === 1 && row.children.length){
				continue;
			}
			row.isChecked === _checkedFlagTrue
				&& idArray.push(key);
		}
		return idArray;
	}
}
