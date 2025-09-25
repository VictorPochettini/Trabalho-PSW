
//Visualização de senha
const icone = document.getElementById("vizualizacao");
const senha = document.getElementById("senha");

icone.addEventListener("click", ()=>{
    if(senha.type=="password"){
        senha.type="text";
        icone.querySelector("img").src = "images/olhoAbertoRoxo.png";
    }else{
        senha.type = "password";
        icone.querySelector("img").src="images/olhoFechadoRoxo.png";
    }
});