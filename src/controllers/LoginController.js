import service from "../services/login.service.js"

class LoginController {
    constructor(loginService) {
        this.loginService = loginService
    }

    login = (req, res) => {
        this.loginService.authenticate(req.body)
            .then(user => user ? res.json(user) : res.status(400).json({message : 'Usuário ou Senha Inválidos'}))
            .catch(console.log);
    }
}

export default new LoginController(service)