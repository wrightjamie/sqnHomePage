const fs = require('fs'); 
['admin.php', 'js/admin.js'].forEach(file => { 
    let content = fs.readFileSync(file, 'utf8'); 
    content = content.replace(/class="btn"([^>]*?)class="btn btn-primary"/g, 'class="btn btn-primary"$1'); 
    fs.writeFileSync(file, content); 
});
