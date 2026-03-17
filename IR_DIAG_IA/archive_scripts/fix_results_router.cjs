const fs = require('fs');
const path = 'client/src/pages/Results.vue';
let content = fs.readFileSync(path, 'utf8');

// Replace import
content = content.replace("import { useRoute } from 'vue-router'", "");

// Replace usage
content = content.replace("const route = useRoute()", "const props = defineProps<{ params: any; query: any }>()");
content = content.replace("const query = route.query", "const query = props.query");

fs.writeFileSync(path, content, 'utf8');
console.log("Results.vue: Fixed router usage.");
