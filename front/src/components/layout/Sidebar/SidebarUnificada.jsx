// @ts-nocheck
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, User, LogOut, Menu, X } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Sidebar/button";
import api from "@/services/api"; 

const ICON_EXPANDED = "h-7 w-7";
const ICON_COLLAPSED = "h-8 w-8";
const TEXT_SIZE = "text-lg";
const TITLE_SIZE = "text-2xl";

const Sidebar = ({ menuItems, userInfo, isOpen, onOpenChange }) => {
  const { isExpanded, isMobile, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const [usuarioReal, setUsuarioReal] = useState(userInfo);

  // 1. ATUALIZAÇÃO REATIVA: Se o Dashboard (ou qualquer pai) mandar dados novos, atualiza.
  useEffect(() => {
    if (userInfo && userInfo.name && userInfo.name !== "Estudante" && userInfo.name !== "Carregando...") {
        setUsuarioReal(userInfo);
    }
  }, [userInfo]);

  // ==================================================================
  // LÓGICA DE CARREGAMENTO BASEADA NA SUA DOCUMENTAÇÃO DA API
  // ==================================================================
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        // 1. Se já tiver dados salvos, usa eles e economiza requisição
        const dadosString = localStorage.getItem("userData");
        if (dadosString) {
          const dados = JSON.parse(dadosString);
          setUsuarioReal({
            name: dados.name_user || dados.nome || dados.name || userInfo?.name,
            email: dados.email_user || dados.email || userInfo?.email,
          });
          // Se tiver dados no cache, não impede a tentativa de buscar dados frescos abaixo
        }

        // 2. Recupera ID e ROLE salvos no Login
        const userId = localStorage.getItem("userIdTemp");
        const userRole = localStorage.getItem("userRole")?.toLowerCase(); 

        if (userId && userRole) {
            let endpoint = "";
            
            // Define a rota específica baseada no cargo
            if (userRole.includes("instrutor") || userRole.includes("professor")) {
                endpoint = `/instrutores/${userId}`; 
            } 
            else if (userRole.includes("aluno")) {
                endpoint = `/alunos/${userId}`;      
            } 
            else {
                endpoint = `/colaboradore/${userId}`; 
            }

            try {
                // Tenta buscar na rota específica (ex: /alunos/11)
                const response = await api.get(endpoint);
                const dadosAPI = response.data;

                const novoUsuario = {
                    name: dadosAPI.name_user || dadosAPI.nome || dadosAPI.nome_instrutor || dadosAPI.nome_aluno || "Usuário",
                    email: dadosAPI.email_user || dadosAPI.email || "email@sistema.com",
                };

                setUsuarioReal(novoUsuario);
                localStorage.setItem("userData", JSON.stringify(dadosAPI));

            } catch (errApi) {
                // --- AQUI ESTÁ A CORREÇÃO MÁGICA ---
                // Se a rota específica falhar (404), tenta a rota universal /users/me
                // Isso resolve o problema do Aluno sem cadastro completo
                console.warn(`Rota específica ${endpoint} falhou (provavelmente 404). Tentando /users/me...`);
                
                try {
                    const resMe = await api.get("/users/me");
                    const dadosMe = resMe.data;
                    
                    const usuarioRecuperado = {
                        name: dadosMe.name_user || dadosMe.nome || dadosMe.username || "Usuário",
                        email: dadosMe.email_user || dadosMe.email || ""
                    };
                    
                    setUsuarioReal(usuarioRecuperado);
                    localStorage.setItem("userData", JSON.stringify(dadosMe)); // Atualiza cache
                } catch (errMe) {
                    console.error("Falha total: Nem a rota específica nem /users/me funcionaram.");
                }
            }
        }
      } catch (error) {
        console.error("Erro geral na sidebar:", error);
      }
    };

    carregarUsuario();
  }, []); 

  const handleLogout = () => {
    localStorage.clear();
    navigate("/"); 
  };

  const UserProfile = ({ isCollapsed = false }) => (
    <div className="p-4 border-t border-white/10 flex-shrink-0">
      {!isCollapsed ? (
        <div className="space-y-2">
          <div className="flex items-center gap-4 px-3 py-3 rounded-lg bg-white/5 transition-all duration-300 hover:bg-white/10">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <User className={`${ICON_EXPANDED} text-white`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-white ${TEXT_SIZE}`}>
                {usuarioReal?.name || "Carregando..."}
              </p>
              <p className="text-sm text-white/50 truncate">{usuarioReal?.email || ""}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-start gap-3 px-3 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="h-6 w-6" />
            <span>Sair</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <User className={`${ICON_COLLAPSED} text-white`} />
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white hover:bg-white/10 h-12 w-12 rounded flex items-center justify-center transition-all duration-300 hover:scale-110"
            title="Sair"
          >
            <LogOut className="h-7 w-7" />
          </button>
        </div>
      )}
    </div>
  );

  const MenuItems = ({
    onItemClick = () => {},
    collapsed = false,
    activeItem,
  }) => (
    <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden px-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.path;
        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onItemClick(item.path);
            }}
            className={`w-full flex items-center rounded-lg transition-all duration-300 mb-2 ${
              isActive
                ? "bg-[#1A5276] text-white shadow-lg"
                : "text-white/60 hover:text-white/90 hover:bg-white/5"
            } ${collapsed ? "justify-center py-4 px-2" : "gap-4 px-4 py-3"}`}
            title={collapsed ? item.title : ""}
          >
            <Icon
              className={`${
                collapsed ? ICON_COLLAPSED : ICON_EXPANDED
              } flex-shrink-0`}
            />
            {!collapsed && (
              <span
                className={`font-normal whitespace-nowrap overflow-hidden text-ellipsis ${TEXT_SIZE}`}
              >
                {item.title}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  if (isMobile) {
    return (
      <>
        <button
          className="md:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-white shadow-lg"
          onClick={() => onOpenChange(true)}
          style={{ backgroundColor: "#406882" }}
        >
          <Menu className="h-5 w-5" />
          <span className="font-medium text-sm">Menu</span>
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => onOpenChange(false)}
            />
            <div
              className="fixed top-0 left-0 h-full w-[250px] flex flex-col"
              style={{
                backgroundColor: "#406882",
                borderTopRightRadius: "24px",
                borderBottomRightRadius: "24px",
              }}
            >
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h2 className={`font-semibold text-white ${TITLE_SIZE}`}>
                  Menu
                </h2>
                <button
                  className="text-white hover:bg-white/10 h-10 w-10 rounded flex items-center justify-center"
                  onClick={() => onOpenChange(false)}
                >
                  <X className={`${ICON_EXPANDED}`} />
                </button>
              </div>
              <MenuItems
                onItemClick={() => onOpenChange(false)}
                activeItem={location.pathname}
              />
              <UserProfile />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <aside
        className="flex flex-col fixed top-0 left-0 h-screen shadow-xl z-40 transition-all duration-500 overflow-hidden"
        style={{ backgroundColor: "#406882", width: isExpanded ? 280 : 72 }}
      >
        <div
          className="px-6 pt-6 pb-4 flex justify-between items-center overflow-hidden flex-shrink-0"
          style={{ minHeight: "80px" }}
        >
          {isExpanded && (
            <h2 className={`font-semibold text-white ${TITLE_SIZE}`}>Menu</h2>
          )}
        </div>
        <MenuItems collapsed={!isExpanded} activeItem={location.pathname} />
        <UserProfile isCollapsed={!isExpanded} />
      </aside>

      <div
        className={`fixed top-0 h-screen z-50 transition-all duration-500 ease-in-out pointer-events-none`}
        style={{
          width: "20px",
          backgroundColor: "#A5C7CB",
          borderTopRightRadius: "24px",
          borderBottomRightRadius: "24px",
          left: isExpanded ? 280 : 72,
        }}
      >
        <Button
          variant="default"
          size="icon"
          onClick={toggleSidebar}
          className="absolute top-1/2 -translate-y-1/2 -left-5 rounded-full h-10 w-10 pointer-events-auto"
          style={{
            backgroundColor: "#A5C7CB",
            color: "white",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
          title={isExpanded ? "Recolher menu" : "Expandir menu"}
          aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            whileHover={{ rotate: isExpanded ? 180 : 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {isExpanded ? (
              <ChevronLeft className={`${ICON_EXPANDED}`} />
            ) : (
              <ChevronRight className={`${ICON_EXPANDED}`} />
            )}
          </motion.div>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;