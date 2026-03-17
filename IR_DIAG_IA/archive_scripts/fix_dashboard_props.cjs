const fs = require('fs');
const path = 'client/src/pages/admin/Dashboard.vue';
let content = fs.readFileSync(path, 'utf8');

const propsSnippet = "const props = defineProps<{ params: any; query: any }>()\nconst router = inject('router') as any";
content = content.replace("const router = inject('router') as any", propsSnippet);

fs.writeFileSync(path, content, 'utf8');
console.log("Dashboard.vue: Added props.");
