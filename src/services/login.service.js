import jwt from "jsonwebtoken";

const db = [ {username:'admin', password:'admin'} ];

export default {
    authenticate: async ({username, password}) => {
    const user = db.find(user=> user.password === password && user.username === username);

    if (user) {
        const token = await jwt.sign({ username }, 'config');

        return {
            token,
            user
        };
    }
}
};
