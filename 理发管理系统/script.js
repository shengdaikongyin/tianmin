// 全局变量
let vipCustomers = [];
let vipHaircutCount = 12; // 默认每年12次
let currentEditId = null;

// DOM元素
const vipHaircutCountInput = document.getElementById('vipHaircutCount');
const saveSettingsBtn = document.getElementById('saveSettings');
const addVipForm = document.getElementById('addVipForm');
const searchInput = document.getElementById('searchInput');
const vipTableBody = document.getElementById('vipTableBody');
const vipStartDate = document.getElementById('vipStartDate');
const exportBtn = document.getElementById('exportBtn');

// 初始化
function init() {
    // 设置当前日期为默认的VIP开始日期
    const today = new Date().toISOString().split('T')[0];
    vipStartDate.value = today;
    
    // 加载设置
    loadSettings();
    // 加载VIP顾客数据
    loadVipCustomers();
    // 渲染表格
    renderVipTable();
    // 添加事件监听器
    addEventListeners();
}

// 加载设置
function loadSettings() {
    const saved = localStorage.getItem('vipHaircutCount');
    if (saved) {
        vipHaircutCount = parseInt(saved);
        vipHaircutCountInput.value = vipHaircutCount;
    }
}

// 保存设置
function saveSettings() {
    vipHaircutCount = parseInt(vipHaircutCountInput.value);
    localStorage.setItem('vipHaircutCount', vipHaircutCount);
    alert('设置已保存！');
    
    // 更新所有VIP顾客的剩余次数（如果需要）
    // 这里可以添加确认提示，是否要更新所有顾客的剩余次数
}

// 加载VIP顾客数据
function loadVipCustomers() {
    const saved = localStorage.getItem('vipCustomers');
    if (saved) {
        vipCustomers = JSON.parse(saved);
        // 转换日期字符串为Date对象
        vipCustomers.forEach(customer => {
            customer.vipStartDate = new Date(customer.vipStartDate);
            customer.vipEndDate = new Date(customer.vipEndDate);
        });
    }
}

// 保存VIP顾客数据
function saveVipCustomers() {
    localStorage.setItem('vipCustomers', JSON.stringify(vipCustomers));
}

// 添加事件监听器
function addEventListeners() {
    saveSettingsBtn.addEventListener('click', saveSettings);
    addVipForm.addEventListener('submit', handleAddVip);
    searchInput.addEventListener('input', handleSearch);
    exportBtn.addEventListener('click', exportToExcel);
}

// 处理添加VIP
function handleAddVip(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const startDate = new Date(document.getElementById('vipStartDate').value);
    
    // 计算到期日期（1年后）
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    if (currentEditId) {
        // 编辑模式
        const index = vipCustomers.findIndex(c => c.id === currentEditId);
        // 只更新需要的信息，保留剩余次数
        vipCustomers[index].name = name;
        vipCustomers[index].phone = phone;
        vipCustomers[index].address = address;
        vipCustomers[index].vipStartDate = startDate;
        vipCustomers[index].vipEndDate = endDate;
        currentEditId = null;
        addVipForm.querySelector('button[type="submit"]').textContent = '添加VIP';
    } else {
        // 添加模式
        const newCustomer = {
            id: Date.now(),
            name,
            phone,
            address,
            vipStartDate: startDate,
            vipEndDate: endDate,
            remainingHaircuts: vipHaircutCount,
            createdAt: new Date()
        };
        vipCustomers.push(newCustomer);
    }
    
    // 保存并更新表格
    saveVipCustomers();
    renderVipTable();
    addVipForm.reset();
    
    // 重置开始日期为当前日期
    vipStartDate.value = new Date().toISOString().split('T')[0];
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    renderVipTable(vipCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) || 
        customer.phone.includes(searchTerm)
    ));
}

// 渲染VIP表格
function renderVipTable(data = vipCustomers) {
    vipTableBody.innerHTML = '';
    
    if (data.length === 0) {
        vipTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #999;">暂无VIP顾客数据</td></tr>';
        return;
    }
    
    data.forEach(customer => {
        const row = document.createElement('tr');
        const isExpired = new Date() > customer.vipEndDate;
        
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.address || '-'}</td>
            <td>${formatDate(customer.vipStartDate)}</td>
            <td>${formatDate(customer.vipEndDate)}</td>
            <td>${customer.remainingHaircuts}</td>
            <td class="${isExpired ? 'status-expired' : 'status-active'}">
                ${isExpired ? '已过期' : '有效期内'}
            </td>
            <td>
                <button class="use-btn" onclick="useHaircut(${customer.id})" ${isExpired ? 'disabled' : ''}>
                    使用
                </button>
                <button class="edit-btn" onclick="editVip(${customer.id})">编辑</button>
                <button class="delete-btn" onclick="deleteVip(${customer.id})">删除</button>
            </td>
        `;
        
        vipTableBody.appendChild(row);
    });
}

// 格式化日期
function formatDate(date) {
    return date.toLocaleDateString('zh-CN');
}

// 使用理发次数
function useHaircut(id) {
    const customer = vipCustomers.find(c => c.id === id);
    if (!customer) return;
    
    if (customer.remainingHaircuts <= 0) {
        alert('该顾客的理发次数已用完！');
        return;
    }
    
    if (new Date() > customer.vipEndDate) {
        alert('该顾客的VIP已过期！');
        return;
    }
    
    customer.remainingHaircuts--;
    saveVipCustomers();
    renderVipTable();
    alert(`${customer.name} 使用了1次理发次数，剩余 ${customer.remainingHaircuts} 次。`);
}

// 编辑VIP顾客
function editVip(id) {
    const customer = vipCustomers.find(c => c.id === id);
    if (!customer) return;
    
    currentEditId = id;
    
    // 填充表单
    document.getElementById('name').value = customer.name;
    document.getElementById('phone').value = customer.phone;
    document.getElementById('address').value = customer.address;
    document.getElementById('vipStartDate').value = customer.vipStartDate.toISOString().split('T')[0];
    
    // 更改按钮文本
    addVipForm.querySelector('button[type="submit"]').textContent = '更新VIP';
    
    // 滚动到表单顶部
    addVipForm.scrollIntoView({ behavior: 'smooth' });
}

// 删除VIP顾客
function deleteVip(id) {
    if (confirm('确定要删除该VIP顾客吗？')) {
        vipCustomers = vipCustomers.filter(c => c.id !== id);
        saveVipCustomers();
        renderVipTable();
        alert('删除成功！');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 添加回车键搜索支持
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// 添加重置表单功能（点击表单外区域）
document.addEventListener('click', function(e) {
    if (!addVipForm.contains(e.target) && e.target !== addVipForm && currentEditId) {
        addVipForm.reset();
        currentEditId = null;
        addVipForm.querySelector('button[type="submit"]').textContent = '添加VIP';
        // 重置开始日期为当前日期
        vipStartDate.value = new Date().toISOString().split('T')[0];
    }
});

// 导出数据功能（可选）
function exportData() {
    const dataStr = JSON.stringify(vipCustomers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vip_customers.json';
    link.click();
    URL.revokeObjectURL(url);
}

// 导出到Excel功能
function exportToExcel() {
    if (vipCustomers.length === 0) {
        alert('没有VIP顾客数据可以导出！');
        return;
    }
    
    // 构建CSV内容
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // 添加表头
    csvContent += 'ID,姓名,电话,地址,VIP开始日期,VIP到期日期,剩余次数,状态\n';
    
    // 添加数据行
    vipCustomers.forEach(customer => {
        const isExpired = new Date() > customer.vipEndDate;
        const status = isExpired ? '已过期' : '有效期内';
        
        const row = [
            customer.id,
            `"${customer.name}"`, // 使用引号包裹，防止包含逗号的内容出错
            `"${customer.phone}"`,
            `"${customer.address || ''}"`,
            formatDate(customer.vipStartDate),
            formatDate(customer.vipEndDate),
            customer.remainingHaircuts,
            status
        ].join(',');
        
        csvContent += row + '\n';
    });
    
    // 创建下载链接
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `理发店VIP顾客数据_${new Date().toISOString().split('T')[0]}.csv`);
    
    // 模拟点击下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('数据导出成功！');
}

// 导入数据功能（可选）
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            // 转换日期字符串为Date对象
            imported.forEach(customer => {
                customer.vipStartDate = new Date(customer.vipStartDate);
                customer.vipEndDate = new Date(customer.vipEndDate);
            });
            
            if (confirm('确定要导入数据吗？这将覆盖当前所有数据！')) {
                vipCustomers = imported;
                saveVipCustomers();
                renderVipTable();
                alert('数据导入成功！');
            }
        } catch (error) {
            alert('数据格式错误，请检查文件！');
        }
    };
    reader.readAsText(file);
}