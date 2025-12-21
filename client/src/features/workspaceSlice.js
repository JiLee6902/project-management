import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../configs/api";

export const fetchWorkspaces = createAsyncThunk("workspace/fetchWorkspaces", async () => {
    try {
        const { data } = await api.get("/workspaces");
        return data.workspaces || [];
    } catch (error) {
        console.log(error?.response?.data?.message || error.message);
        return [];
    }
});

const initialState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
};

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload;
        },
        setCurrentWorkspace: (state, action) => {
            localStorage.setItem("currentWorkspaceId", action.payload);
            state.currentWorkspace = state.workspaces.find((w) => w.id === action.payload);
        },
        addWorkspace: (state, action) => {
            state.workspaces.push(action.payload);

            // set current workspace to the new workspace
            if (state.currentWorkspace?.id !== action.payload.id) {
                state.currentWorkspace = action.payload;
            }
        },
        updateWorkspace: (state, action) => {
            state.workspaces = state.workspaces.map((w) =>
                w.id === action.payload.id ? action.payload : w
            );

            // if current workspace is updated, set it to the updated workspace
            if (state.currentWorkspace?.id === action.payload.id) {
                state.currentWorkspace = action.payload;
            }
        },
        deleteWorkspace: (state, action) => {
            state.workspaces = state.workspaces.filter((w) => w._id !== action.payload);
        },
        addProject: (state, action) => {
            if (!state.currentWorkspace) return;
            const projectExists = (state.currentWorkspace.projects || []).some(p => p.id === action.payload.id);
            if (!projectExists) {
                state.currentWorkspace.projects = [...(state.currentWorkspace.projects || []), action.payload];
                state.workspaces = state.workspaces.map((w) =>
                    w.id === state.currentWorkspace.id ? { ...w, projects: [...(w.projects || []), action.payload] } : w
                );
            }
        },
        addTask: (state, action) => {
            if (!state.currentWorkspace?.projects) return;
            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                if (p.id === action.payload.projectId) {
                    const taskExists = (p.tasks || []).some(t => t.id === action.payload.id);
                    if (!taskExists) {
                        p.tasks = [...(p.tasks || []), action.payload];
                    }
                }
                return p;
            });

            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id ? {
                    ...w, projects: (w.projects || []).map((p) =>
                        p.id === action.payload.projectId ? {
                            ...p,
                            tasks: (p.tasks || []).some(t => t.id === action.payload.id)
                                ? p.tasks
                                : [...(p.tasks || []), action.payload]
                        } : p
                    )
                } : w
            );
        },
        updateTask: (state, action) => {
            if (!state.currentWorkspace?.projects) return;
            state.currentWorkspace.projects.map((p) => {
                if (p.id === action.payload.projectId) {
                    p.tasks = (p.tasks || []).map((t) =>
                        t.id === action.payload.id ? action.payload : t
                    );
                }
            });
            // find workspace and project by id and update task in it
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id ? {
                    ...w, projects: (w.projects || []).map((p) =>
                        p.id === action.payload.projectId ? {
                            ...p, tasks: (p.tasks || []).map((t) =>
                                t.id === action.payload.id ? action.payload : t
                            )
                        } : p
                    )
                } : w
            );
        },
        deleteTask: (state, action) => {
            if (!state.currentWorkspace?.projects) return;
            state.currentWorkspace.projects.map((p) => {
                p.tasks = (p.tasks || []).filter((t) => !action.payload.includes(t.id));
                return p;
            });
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id ? {
                    ...w, projects: (w.projects || []).map((p) =>
                        p.id === action.payload.projectId ? {
                            ...p, tasks: (p.tasks || []).filter((t) => !action.payload.includes(t.id))
                        } : p
                    )
                } : w
            );
        },
        updateProject: (state, action) => {
            if (!state.currentWorkspace?.projects) return;
            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
                p.id === action.payload.id ? { ...p, ...action.payload } : p
            );
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id ? {
                    ...w, projects: (w.projects || []).map((p) =>
                        p.id === action.payload.id ? { ...p, ...action.payload } : p
                    )
                } : w
            );
        },
        removeProject: (state, action) => {
            if (!state.currentWorkspace?.projects) return;
            state.currentWorkspace.projects = state.currentWorkspace.projects.filter((p) => p.id !== action.payload);
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id ? {
                    ...w, projects: (w.projects || []).filter((p) => p.id !== action.payload)
                } : w
            );
        },
        addProjectMember: (state, action) => {
            if (!state.currentWorkspace?.projects) return;
            const { projectId, member } = action.payload;
            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                if (p.id === projectId) {
                    const memberExists = (p.members || []).some(m => m.id === member.id);
                    if (!memberExists) {
                        return { ...p, members: [...(p.members || []), member] };
                    }
                }
                return p;
            });
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id ? {
                    ...w, projects: (w.projects || []).map((p) => {
                        if (p.id === projectId) {
                            const memberExists = (p.members || []).some(m => m.id === member.id);
                            if (!memberExists) {
                                return { ...p, members: [...(p.members || []), member] };
                            }
                        }
                        return p;
                    })
                } : w
            );
        },
        resetWorkspaceState: (state) => {
            state.workspaces = [];
            state.currentWorkspace = null;
            state.loading = false;
            localStorage.removeItem("currentWorkspaceId");
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchWorkspaces.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
            state.workspaces = action.payload;
            if (action.payload.length > 0) {
                const localStorageCurrentWorkspaceId = localStorage.getItem("currentWorkspaceId");
                if (localStorageCurrentWorkspaceId) {
                    const findWorkspace = action.payload.find((w) => w.id === localStorageCurrentWorkspaceId);
                    if (findWorkspace) {
                        state.currentWorkspace = findWorkspace;
                    } else {
                        state.currentWorkspace = action.payload[0];
                    }
                } else {
                    state.currentWorkspace = action.payload[0];
                }
            }
            state.loading = false;
        });
        builder.addCase(fetchWorkspaces.rejected, (state) => {
            state.loading = false;
        });
    }
});

export const { setWorkspaces, setCurrentWorkspace, addWorkspace, updateWorkspace, deleteWorkspace, addProject, addTask, updateTask, deleteTask, updateProject, removeProject, addProjectMember, resetWorkspaceState } = workspaceSlice.actions;
export default workspaceSlice.reducer;
