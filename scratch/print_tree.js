const d = require('./full_settings.json');
function printTree(nodes, indent) {
  indent = indent || '';
  for (const n of nodes) {
    console.log(indent + '[L' + n.level + '] ' + n.name + ' (' + (n.leader_name || '-') + ')');
    if (n.children.length) printTree(n.children, indent + '  ');
  }
}
printTree(d.org_structure);
