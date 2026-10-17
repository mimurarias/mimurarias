document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle logic
  const themeToggleBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';
    themeToggleBtn.setAttribute('title', theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro');
    themeToggleBtn.setAttribute('aria-label', theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro');
  }

  // Filter Projects by Category
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sections = document.querySelectorAll('.section-block');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      sections.forEach(section => {
        const category = section.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          section.style.display = 'block';
        } else {
          section.style.display = 'none';
        }
      });
    });
  });
});
