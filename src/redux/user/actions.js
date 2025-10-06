// src/redux/user/actions.js
import { apiRequest } from '../../api/apiCliente';

export const loginUser = (credentials) => async (dispatch) => {
  try {
    const user = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    dispatch({ type: 'user/login', payload: user });
  } catch (error) {
    alert(error.message);
  }
};
