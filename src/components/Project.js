import React from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";

const fetchProjects = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get("http://localhost:5000/projects", {
    headers: { Authorization: token },
  });
  return res.data;
};

const createProject = async (project) => {
  const token = localStorage.getItem("token");
  const res = await axios.post("http://localhost:5000/projects", project, {
    headers: { Authorization: token },
  });
  return res.data;
};

export const Projects = () => {
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery("projects", fetchProjects);

  const mutation = useMutation(createProject, {
    onSuccess: () => {
      queryClient.invalidateQueries("projects");
    },
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const description = formData.get("description");
    mutation.mutate({ name, description });
  };

  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>Error: {error.message}</span>;

  return (
    <div>
      <h1>Projects</h1>
      <form onSubmit={handleCreateProject}>
        <input type="text" name="name" placeholder="Project Name" />
        <input
          type="text"
          name="description"
          placeholder="Project Description"
        />
        <button type="submit">Create Project</button>
      </form>
      <ul>
        {data.map((project) => (
          <li key={project.id}>
            {project.name} - {project.description}
          </li>
        ))}
      </ul>
    </div>
  );
};
