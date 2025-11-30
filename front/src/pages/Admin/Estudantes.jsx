import SidebarUnificada from "@/components/layout/Sidebar/SidebarUnificada";
import { sidebarConfigs } from "@/components/layout/Sidebar/sidebarConfigs";
import { UserPlus, Search, Filter, Trash2, FileText, MoreVertical, Users } from "lucide-react"; // Adicionei ícones para melhor visual

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSidebar } from "@/context/SidebarContext";
import api from "@/services/api";
import { useNavigate } from 'react-router-dom'; 

export default function Estudantes() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });
  const [actionMenu, setActionMenu] = useState({ isOpen: false, student: null, position: { x: 0, y: 0 } });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isMobile, sidebarWidth } = useSidebar();
  const actionMenuRef = useRef(null);
  const navigate = useNavigate();

  const handleCadastrar = (e) => {
    e.stopPropagation();
    navigate("/student-signin");
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/alunos/');
      
      const mappedStudents = response.data.map(user => {
        const phone = user.contatos && user.contatos.length > 0 
          ? user.contatos[0].numero_contato 
          : '-';

        // --- LÓGICA ROBUSTA DE ID (Mantida conforme solicitado para correção do Bug da API) ---
        let validStudentId = null;

        if (user.estudante && user.estudante.id_estudante) {
            validStudentId = user.estudante.id_estudante;
        }
        else if (user.id_estudante) {
            validStudentId = user.id_estudante;
        }
        else if (user.Estudante && user.Estudante.id_estudante) {
            validStudentId = user.Estudante.id_estudante;
        }

        if (!validStudentId) {
            console.warn(`AVISO: Usuário ${user.name_user} sem 'id_estudante'.`);
        }

        return {
          id: validStudentId,
          userId: user.id_user,
          name: user.name_user,
          email: user.email_user,
          phone: phone,
        };
      });

      mappedStudents.sort((a, b) => a.name.localeCompare(b.name));

      setStudents(mappedStudents);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar estudantes:", err);
      if (err.response && err.response.status === 403) {
        setError("Sem permissão para listar estudantes.");
      } else {
        setError("Erro ao carregar a lista de estudantes.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Otimização: useMemo substitui o useEffect para filtragem (Mais performático)
  const filteredStudents = useMemo(() => {
    let result = students;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(student => 
        student.name.toLowerCase().includes(term) ||
        (student.email && student.email.toLowerCase().includes(term))
      );
    }
    
    if (sortBy) {
      result = [...result].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'email') return (a.email || '').localeCompare(b.email || '');
        return 0;
      });
    }
    
    return result;
  }, [students, searchTerm, sortBy]);

  const handleActionMenuOpen = (student, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = 150; 
    
    const yPosition = rect.bottom + menuHeight > viewportHeight ? 
      rect.top - menuHeight : rect.bottom;
    
    setActionMenu({
      isOpen: true,
      student,
      position: {
        x: rect.left - 100, 
        y: yPosition
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenu({ isOpen: false, student: null, position: { x: 0, y: 0 } });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = (student) => {
    setDeleteModal({ isOpen: true, student });
    setActionMenu({ isOpen: false, student: null, position: { x: 0, y: 0 } });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.student) {
      try {
        const idToDelete = deleteModal.student.userId;
        await api.delete(`/users/${idToDelete}`);
        
        setStudents(prev => prev.filter(student => student.userId !== idToDelete));
      } catch (err) {
        console.error("Erro ao excluir estudante:", err);
        alert("Erro ao excluir estudante. Verifique se ele possui pendências.");
      }
    }
    setDeleteModal({ isOpen: false, student: null });
  };

  const handleViewTechnicalSheet = (student) => {
    if (!student.id) {
        alert(`Não foi possível abrir a ficha técnica de "${student.name}".\n\nMotivo: ID de estudante não encontrado.`);
        return;
    }
    navigate(`/admin/ficha/${student.id}`);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F9FF] font-inter">
      <SidebarUnificada
        menuItems={sidebarConfigs.administrador.menuItems}
        userInfo={sidebarConfigs.administrador.userInfo}
        isOpen={menuOpen}
        onOpenChange={setMenuOpen}
      />

      <div
        className="flex flex-col flex-1 transition-all duration-300 min-w-0"
        style={{
          marginLeft: !isMobile ? `${sidebarWidth}px` : "0",
          width: !isMobile ? `calc(100% - ${sidebarWidth}px)` : "100%",
        }}
      >
        <main className="flex-1 flex items-center justify-center py-4 px-3 sm:px-4 lg:px-6 pt-20 sm:pt-6 lg:py-8 pb-6 sm:pb-8">
          <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 ${isMobile ? 'w-full mx-auto p-4' : 'w-full max-w-7xl mx-auto p-8'}`}>
            
            {/* Cabeçalho */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 gap-4">
              <h1 className={`font-bold text-[#111111] ${isMobile ? 'text-2xl' : 'text-[28px]'}`}>
                Gerenciar Estudantes
              </h1>

              <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                {/* Botão Cadastrar Otimizado */}
                <button 
                  onClick={handleCadastrar} 
                  className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  <UserPlus size={18} /> 
                  <span>Cadastrar</span>
                </button>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#2B668B] transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar aluno..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-60 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-[#313A4E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B668B]/20 focus:border-[#2B668B] transition-all"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Filter className="w-4 h-4 text-gray-400" />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full sm:w-48 pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-[#313A4E] focus:outline-none focus:ring-2 focus:ring-[#2B668B]/20 focus:border-[#2B668B] appearance-none cursor-pointer transition-all"
                    >
                      <option value="">Ordenar</option>
                      <option value="name">Nome (A-Z)</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                   <span>⚠️</span> {error}
                </div>
            )}

            {/* Tabela de estudantes */}
            <div className="overflow-hidden rounded-xl border border-gray-100">
              {/* Cabeçalho da tabela - apenas desktop */}
              {!isMobile && (
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/80 border-b border-gray-100">
                  <div className="col-span-4"><span className="text-sm font-semibold text-gray-600">Nome</span></div>
                  <div className="col-span-4"><span className="text-sm font-semibold text-gray-600">Email</span></div>
                  <div className="col-span-2"><span className="text-sm font-semibold text-gray-600">Telefone</span></div>
                  <div className="col-span-2 text-right"><span className="text-sm font-semibold text-gray-600">Ações</span></div>
                </div>
              )}

              {/* Corpo da tabela */}
              <div className="bg-white">
                {loading ? (
                      <div className="text-center py-16">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B668B]"></div>
                        <p className="mt-3 text-gray-500 text-sm">Carregando...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Users size={48} className="mb-3 opacity-20" />
                    <p>Nenhum estudante encontrado</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.userId}
                      className={`${isMobile ? 'flex flex-col gap-3 p-5 border-b last:border-0' : 'grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-0 items-center'} border-gray-100 hover:bg-blue-50/30 transition-colors duration-150`}
                    >
                      {isMobile ? (
                        <>
                          <div className="flex justify-between items-center">
                             <div className="flex flex-col">
                                <span className="font-bold text-gray-800 text-lg">{student.name}</span>
                                <span className="text-gray-500 text-sm">{student.email}</span>
                             </div>
                             <button
                                onClick={(e) => handleActionMenuOpen(student, e)}
                                className="p-2 text-gray-400 hover:text-[#2B668B] hover:bg-blue-50 rounded-full"
                              >
                                <MoreVertical size={20} />
                              </button>
                          </div>
                          
                          <div className="flex justify-between items-center mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                             <span>{student.phone}</span>
                             <button
                                onClick={() => handleViewTechnicalSheet(student)}
                                className={`flex items-center gap-1 font-medium ${!student.id ? 'text-gray-400' : 'text-[#2B668B]'}`}
                             >
                                <FileText size={16} /> Ficha Técnica
                             </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-4">
                            <span className="font-medium text-gray-800">{student.name}</span>
                          </div>

                          <div className="col-span-4">
                            <span className="text-gray-600 text-sm">{student.email}</span>
                          </div>

                          <div className="col-span-2">
                             <span className="text-gray-600 text-sm">{student.phone}</span>
                          </div>

                          <div className="col-span-2 flex justify-end items-center gap-2">
                            <button
                                onClick={() => handleViewTechnicalSheet(student)}
                                title="Ficha Técnica"
                                className={`p-2 rounded-lg transition-colors ${!student.id ? 'text-gray-300 cursor-not-allowed' : 'text-[#2B668B] hover:bg-blue-50'}`}
                            >
                                <FileText size={18} />
                            </button>
                            <button
                              onClick={(e) => handleActionMenuOpen(student, e)}
                              className="p-2 text-gray-500 hover:text-[#2B668B] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {actionMenu.isOpen && (
        <div
          ref={actionMenuRef}
          className={`fixed bg-white shadow-xl rounded-xl py-2 z-50 border border-gray-100 ${
            isMobile 
              ? 'w-11/12 max-w-xs bottom-4 left-1/2 transform -translate-x-1/2' 
              : 'min-w-48'
          }`}
          style={!isMobile ? { left: `${actionMenu.position.x}px`, top: `${actionMenu.position.y}px`, transform: 'translateX(-50%)' } : {}}
        >
          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
            Opções
          </div>
          
          <button
            onClick={() => {
                handleViewTechnicalSheet(actionMenu.student);
                setActionMenu({ ...actionMenu, isOpen: false });
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText size={16} /> Visualizar Ficha
          </button>

          <button
            onClick={() => handleDeleteClick(actionMenu.student)}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={16} /> Excluir Estudante
          </button>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Tem certeza que deseja excluir <strong>{deleteModal.student?.name}</strong>? <br/>
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, student: null })}
                className="px-5 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-md shadow-red-200"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}