/* ePTW shared sidebar component — offline-safe, no network needed.
   Usage: <body data-active="permits">  ... <div id="sidebar"></div>
   The page's data-active picks the highlighted item and opens the right group.
   Values: home | tasks | permits | isolations | ora | lessons | parameters
   Renders into #sidebar if present, else into the first <aside class="sidebar">. */
(function () {
  var active = (document.body.getAttribute('data-active') || '').toLowerCase();

  // which group is expanded for a given active item
  var groupOf = { permits: 'permits', isolations: 'isolations', ora: 'ora' };
  var openGroup = groupOf[active] || '';

  function link(id, href, label, notif) {
    var cls = 'sb-link' + (active === id ? ' active' : '');
    var n = notif ? ' <span class="notif">' + notif + '</span>' : '';
    return '<a class="' + cls + '" href="' + href + '">' + label + n + '</a>';
  }

  function group(id, label, sublinks) {
    var isOpen = openGroup === id;
    var subs = sublinks.map(function (s) {
      var cls = 'sb-sublink' + (s.tbd ? ' tbd' : '') + (s.active && active === openGroup ? ' active' : '');
      return '<a class="' + cls + '" href="' + s.href + '">' + s.label + '</a>';
    }).join('');
    return '' +
      '<div class="sb-group' + (isOpen ? ' open' : '') + '" id="grp-' + id + '">' +
        '<div class="sb-group-h" onclick="sbToggle(\'grp-' + id + '\')">' + label +
          ' <span class="chev">\u25BE</span></div>' +
        '<div class="sb-sub">' + subs + '</div>' +
      '</div>';
  }

  var html = '' +
    '<nav class="sb-nav">' +
      link('home', '01_homepage.html', 'Home page') +
      link('tasks', '07_tasks_to_do.html', 'Tasks to do', '8') +
      '<div class="sb-div"></div>' +
      group('permits', 'Permits', [
        { href: '02_permits.html', label: 'My Permits', active: true },
        { href: '02_permits.html', label: 'All Permits' },
        { href: '02_permits.html?filter=fav', label: '\u2605 Favourites' }
      ]) +
      '<div class="sb-div"></div>' +
      group('isolations', 'Isolations', [
        { href: '02_isolations.html', label: 'My Isolations', active: true },
        { href: '02_isolations.html', label: 'All Isolations' },
        { href: '02_isolations.html?filter=fav', label: '\u2605 Favourites' }
      ]) +
      '<div class="sb-div"></div>' +
      group('ora', 'ORA', [
        { href: '03_ora.html', label: 'My ORA', active: true },
        { href: '03_ora.html', label: 'All ORA' },
        { href: '#', label: '\u2026 TBD', tbd: true }
      ]) +
      '<div class="sb-div"></div>' +
      link('projects', '04_projects.html', 'Projects') +
      link('lessons', '08_lessons_learned.html', 'Lessons learned') +
      '<div class="sb-div"></div>' +
      link('parameters', '#', 'Parameters') +
    '</nav>' +
    '<div class="sb-foot">' +
      '<a class="sb-link" href="#">Log out</a>' +
      '<div class="sb-user"><div class="avatar">LB</div>' +
        '<div><div class="u-n">Lauren Bailey</div>' +
        '<div class="u-r">Area Authority \u00B7 Bacton</div></div></div>' +
    '</div>';

  function mount() {
    var host = document.getElementById('sidebar');
    if (!host) host = document.querySelector('aside.sidebar');
    if (!host) return;
    host.className = 'sidebar';
    host.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* global group toggle */
function sbToggle(id) {
  var el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
