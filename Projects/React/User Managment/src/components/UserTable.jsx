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
    <div>
      <h1>Utulisateur</h1>
      <table className="table table-dark table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Nom Complete</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <th>{user.id}</th>
              <th>{user.nom}</th>
              <th>{user.email}</th>
              <th>
                <button onClick={() =>handleRemoveUser(user.id)}>Supprimer</button>
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
