import UserForm from "./components/UserForm";
import UserTable from "./components/UserTable";

function App() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm">
            <div className="card-body">
              <UserForm />
              <hr className="my-4" />
              <UserTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;