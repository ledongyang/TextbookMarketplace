$('#textbook-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/textbooks?' + search, function(data) {
    $('#textbook-grid').html('');
    data.forEach(function(textbook) {
      $('#textbook-grid').append(`
        <div class="col-md-4 col-sm-6">
          <div class="thumbnail">
            <img src="${ textbook.image }">
            <div class="caption">
              <h4>${ textbook.name }</h4>
            </div>
            <p>
              <a href="/textbooks/${ textbook._id }" class="btn btn-primary">More Info</a>
            </p>
          </div>
        </div>
      `);
    });
  });
});

$('#textbook-search').submit(function(event) {
  event.preventDefault();
});