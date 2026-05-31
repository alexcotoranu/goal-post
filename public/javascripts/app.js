document.addEventListener('DOMContentLoaded', function() {
  // Auto-focus quick-add on dashboard
  var qi = document.querySelector('.quick-add-input');
  if (qi) qi.focus();

  // Submit quick-add on Enter (already works via form, this just prevents double submit)
  var qa = document.querySelector('.quick-add');
  if (qa) {
    qa.addEventListener('submit', function() {
      var btn = qa.querySelector('.quick-add-btn');
      if (btn) btn.disabled = true;
    });
  }
});
