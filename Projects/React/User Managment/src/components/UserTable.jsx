import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeUser } from "../Redux/userSlice";

function UserTable() {
  const users = useSelector((state) => state.users.users);

  const dispatch = useDispatch();

  const handleRemoveUser = (id) => {
    dispatch(removeUser(id));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Utilisateurs</h1>
      <table className="table table-striped">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Nom Complet</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.nom}</td>
              <td>{user.email}</td>
              <td>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="btn btn-danger btn-sm"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
