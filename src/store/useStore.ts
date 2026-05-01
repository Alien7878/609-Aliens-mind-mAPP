import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NodeData {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  color: string;
}

export interface EdgeData {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface ProjectData {
  id: string;
  name: string;
  nodes: NodeData[];
  edges: EdgeData[];
  canvas: { x: number; y: number; scale: number };
}

interface AppState {
  projects: ProjectData[];
  activeProjectId: string;
  theme: 'dark' | 'light';
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  undoHistory: ProjectData[][];
  redoHistory: ProjectData[][];

  // Project management
  createProject: (name: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  updateProjectName: (id: string, name: string) => void;

  // Theme
  toggleTheme: () => void;

  // History
  undo: () => void;
  redo: () => void;
  _pushHistory: () => void;

  // Node & Edge management
  addNode: (x: number, y: number, text?: string, parentId?: string) => string;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  moveNodeAndChildren: (id: string, dx: number, dy: number) => void;
  deleteNode: (id: string) => void;
  duplicateNodeSubtree: (id: string) => void;
  addEdge: (sourceId: string, targetId: string) => void;
  deleteEdge: (id: string) => void;

  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;

  setCanvas: (x: number, y: number, scale: number) => void;
  clearMap: () => void;
}

export const COLORS = [
  'bg-blue-500/20 border-blue-500/50', 
  'bg-emerald-500/20 border-emerald-500/50', 
  'bg-amber-500/20 border-amber-500/50', 
  'bg-rose-500/20 border-rose-500/50', 
  'bg-purple-500/20 border-purple-500/50',
  'bg-white/5 border-white/20'
];

function createDefaultProject(id: string, name: string): ProjectData {
  return {
    id,
    name,
    nodes: [{ id: 'root', x: 0, y: 0, width: 192, height: 80, text: 'ایده مرکزی ۶۰۹', color: COLORS[4] }],
    edges: [],
    canvas: { x: window.innerWidth ? window.innerWidth / 2 - 100 : 0, y: window.innerHeight ? window.innerHeight / 2 - 50 : 0, scale: 1 },
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [createDefaultProject('default-project', 'پروژه جدید')],
      activeProjectId: 'default-project',
      theme: 'dark',
      selectedNodeId: null,
      selectedEdgeId: null,

      undoHistory: [],
      redoHistory: [],

      undo: () => set((state) => {
        if (state.undoHistory.length === 0) return state;
        const previous = state.undoHistory[state.undoHistory.length - 1];
        const newUndoHistory = state.undoHistory.slice(0, -1);
        return {
          projects: previous,
          undoHistory: newUndoHistory,
          redoHistory: [...state.redoHistory, state.projects]
        };
      }),

      redo: () => set((state) => {
        if (state.redoHistory.length === 0) return state;
        const next = state.redoHistory[state.redoHistory.length - 1];
        const newRedoHistory = state.redoHistory.slice(0, -1);
        return {
          projects: next,
          undoHistory: [...state.undoHistory, state.projects],
          redoHistory: newRedoHistory
        };
      }),

      _pushHistory: () => set((state) => ({
        undoHistory: [...state.undoHistory, state.projects].slice(-20),
        redoHistory: []
      })),

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      createProject: (name) => {
        get()._pushHistory();
        const newProj = createDefaultProject(crypto.randomUUID(), name);
        set((state) => ({ projects: [...state.projects, newProj], activeProjectId: newProj.id }));
      },
      deleteProject: (id) => {
        get()._pushHistory();
        set((state) => {
          const newProjects = state.projects.filter(p => p.id !== id);
          if (newProjects.length === 0) {
            const newProj = createDefaultProject(crypto.randomUUID(), 'پروژه جدید');
            return { projects: [newProj], activeProjectId: newProj.id };
          }
          return { projects: newProjects, activeProjectId: state.activeProjectId === id ? newProjects[0].id : state.activeProjectId };
        });
      },
      duplicateProject: (id) => {
        get()._pushHistory();
        set((state) => {
          const proj = state.projects.find(p => p.id === id);
          if (!proj) return state;
          const newProj = { ...proj, id: crypto.randomUUID(), name: proj.name + ' - کپی' };
          return { projects: [...state.projects, newProj], activeProjectId: newProj.id };
        });
      },
      setActiveProject: (id) => set({ activeProjectId: id, selectedNodeId: null, selectedEdgeId: null }),
      updateProjectName: (id, name) => {
        get()._pushHistory();
        set((state) => ({
          projects: state.projects.map(p => p.id === id ? { ...p, name } : p)
        }));
      },

      addNode: (x, y, text = 'ایده جدید', parentId) => {
        get()._pushHistory();
        const id = crypto.randomUUID();
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        set((state) => {
          const proj = state.projects.find(p => p.id === state.activeProjectId);
          if (!proj) return state;

          const newNodes = [...proj.nodes, { id, x, y, width: 160, height: 64, text, color }];
          const newEdges = parentId 
            ? [...proj.edges, { id: crypto.randomUUID(), sourceId: parentId, targetId: id }]
            : proj.edges;
          
          return {
            projects: state.projects.map(p => p.id === proj.id ? { ...p, nodes: newNodes, edges: newEdges } : p),
            selectedNodeId: id,
            selectedEdgeId: null
          };
        });
        return id;
      },

      updateNode: (id, data) => {
        set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj) return state;
        return {
          projects: state.projects.map(p => p.id === proj.id ? {
            ...p, nodes: p.nodes.map(n => n.id === id ? { ...n, ...data } : n)
          } : p)
        };
      });
      },

      moveNodeAndChildren: (id, dx, dy) => {
        set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj) return state;

        // find all descendent nodes
        const nodesToMove = new Set<string>();
        nodesToMove.add(id);

        let added = true;
        while (added) {
          added = false;
          proj.edges.forEach(e => {
            if (nodesToMove.has(e.sourceId) && !nodesToMove.has(e.targetId)) {
              nodesToMove.add(e.targetId);
              added = true;
            }
          });
        }

        return {
          projects: state.projects.map(p => p.id === proj.id ? {
            ...p, nodes: p.nodes.map(n => nodesToMove.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)
          } : p)
        };
      });
      },

      deleteNode: (id) => {
        get()._pushHistory();
        set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj) return state;
        
        // Find subtree to delete
        const nodesToDelete = new Set<string>();
        nodesToDelete.add(id);

        let added = true;
        while (added) {
          added = false;
          proj.edges.forEach(e => {
            if (nodesToDelete.has(e.sourceId) && !nodesToDelete.has(e.targetId)) {
              nodesToDelete.add(e.targetId);
              added = true;
            }
          });
        }

        return {
          projects: state.projects.map(p => p.id === proj.id ? {
            ...p,
            nodes: p.nodes.filter(n => !nodesToDelete.has(n.id)),
            edges: p.edges.filter(e => !nodesToDelete.has(e.sourceId) && !nodesToDelete.has(e.targetId))
          } : p),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
        };
      });
      },

      duplicateNodeSubtree: (id) => {
        get()._pushHistory();
        set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj || id === 'root') return state; // don't duplicate root like this

        // Extract subtree
        const nodesToDup = new Set<string>();
        nodesToDup.add(id);
        let added = true;
        while (added) {
          added = false;
          proj.edges.forEach(e => {
            if (nodesToDup.has(e.sourceId) && !nodesToDup.has(e.targetId)) {
              nodesToDup.add(e.targetId);
              added = true;
            }
          });
        }

        const idMap = new Map<string, string>();
        const newNodes: NodeData[] = [];
        const newEdges: EdgeData[] = [];

        proj.nodes.forEach(n => {
          if (nodesToDup.has(n.id)) {
            const newId = crypto.randomUUID();
            idMap.set(n.id, newId);
            // offset by 50px
            newNodes.push({ ...n, id: newId, x: n.x + 50, y: n.y + 50 });
          }
        });

        proj.edges.forEach(e => {
          if (nodesToDup.has(e.sourceId) && nodesToDup.has(e.targetId)) {
            newEdges.push({ id: crypto.randomUUID(), sourceId: idMap.get(e.sourceId)!, targetId: idMap.get(e.targetId)! });
          }
        });

        return {
          projects: state.projects.map(p => p.id === proj.id ? {
            ...p,
            nodes: [...p.nodes, ...newNodes],
            edges: [...p.edges, ...newEdges]
          } : p),
          selectedNodeId: idMap.get(id) || null
        };
      });
      },

      addEdge: (sourceId, targetId) => {
        get()._pushHistory();
        set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj) return state;
        
        // Prevent simple cycles (source = target) or multiple parents
        if (sourceId === targetId) return state;
        if (proj.edges.find(e => e.targetId === targetId)) return state; // standard mindmaps usually have 1 parent max

        return {
          projects: state.projects.map(p => p.id === proj.id ? {
             ...p,
             edges: [...p.edges, { id: crypto.randomUUID(), sourceId, targetId }]
          } : p)
        };
      });
      },

      deleteEdge: (id) => {
        get()._pushHistory();
        set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj) return state;
        return {
          projects: state.projects.map(p => p.id === proj.id ? {
            ...p, edges: p.edges.filter(e => e.id !== id)
          } : p),
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId
        };
      });
      },

      selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

      setCanvas: (x, y, scale) => set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj) return state;
        return {
          projects: state.projects.map(p => p.id === proj.id ? {
            ...p, canvas: { x, y, scale }
          } : p)
        };
      }),
      
      clearMap: () => {
        get()._pushHistory();
        set((state) => {
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        if (!proj) return state;
        const rootNode = proj.nodes.find(n => n.id === 'root') || { id: 'root', x: 0, y: 0, width: 192, height: 80, text: 'ایده مرکزی', color: COLORS[4] };
        return {
          projects: state.projects.map(p => p.id === proj.id ? {
            ...p,
            nodes: [{...rootNode, text: 'ایده مرکزی ۶۰۹'}],
            edges: [],
          } : p),
          selectedNodeId: null,
          selectedEdgeId: null
        };
      });
      }
    }),
    {
      name: '609-mindmap-storage-v2', // bump version effectively by renaming
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => !['undoHistory', 'redoHistory'].includes(key))
      ),
    }
  )
);
