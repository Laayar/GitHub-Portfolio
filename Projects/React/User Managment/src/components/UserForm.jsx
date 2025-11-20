import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../Redux/userSlice";

function UserForm() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");

  const dispatch = useDispatch();

  const handleClick = () => {
    if (nom.trim().length < 3 || !email.includes("@")) {
      alert("Verifier!!!!");
      return;
    }

    dispatch(addUser({ nom, email }));
    setNom("");
    setEmail("");
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6 mb-3">
          <input
            type="text"
            className="form-control"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Entrez votre nom complet"
          />
        </div>
        <div className="col-md-6 mb-3">
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
        </div>
        <div className="col-12">
          <button className="btn btn-primary" onClick={handleClick}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserForm;
