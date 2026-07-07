const fs=require('fs'); 
let c=fs.readFileSync('admin.php', 'utf8'); 
c=c.replace(/<button(?!\s+class="tab-btn|\s+class="btn|\s+class="admin-)/g, '<button class="btn"'); 
c=c.replace(/class="btn-primary"/g, 'class="btn btn-primary"'); 
fs.writeFileSync('admin.php', c); 
let j=fs.readFileSync('js/admin.js', 'utf8'); 
j=j.replace(/<button(?!\s+class="tab-btn|\s+class="btn|\s+class="admin-)/g, '<button class="btn"'); 
fs.writeFileSync('js/admin.js', j);
