const fileInput = document.getElementById("fileInput");
    const fotoPerfil = document.getElementById("fotoPerfil");

    fileInput.addEventListener("change", function(event) {
      const arquivo = event.target.files[0];
      if (arquivo) {
        const reader = new FileReader();
        reader.onload = function(e) {
          fotoPerfil.src = e.target.result;
        }
        reader.readAsDataURL(arquivo);
      }
    });