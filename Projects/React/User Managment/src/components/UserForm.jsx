import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../Redux/userSlice";

function UserForm() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");

  const dispatch = useDispatch();
  
  const handleClick = () => {
    if (nom.trim().length < 3 || !email.includes("@")){
      alert("Verifier!!!!");
      return;
    };

    dispatch(addUser({nom, email}));
    setNom("");
    setEmail("");
  };
  

  return (
    <div>
      <input
        type="text"
        className="form-control"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Entre votre nom complete"
      />
      <input
        type="email"
        className="form-control"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com"
      />
      <button onClick={handleClick}>Ajouter</button>
    </div>
  );
}

export default UserForm;
