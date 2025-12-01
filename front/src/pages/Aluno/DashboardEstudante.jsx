// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Download,
  ArrowRight,
  Loader,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/layout/Sidebar/SidebarUnificada";
import { sidebarConfigs } from "@/components/layout/Sidebar/sidebarConfigs";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// --- Componentes de Estilo ---
const InfoCard = ({ icon: Icon, label, value, subtext, color, loading, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 transition-all h-full ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200' : ''}`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
        {loading ? (
          <Loader className="h-6 w-6 animate-spin text-gray-400 mt-2" />
        ) : (
          <div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 truncate" title={typeof value === 'string' ? value : ''}>
              {value}
            </p>
            {subtext && (
              <p className="text-sm text-gray-500 mt-1 truncate">
                {subtext}
              </p>
            )}
          </div>
        )}
      </div>
      <div
        className="p-3 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${color || "#313A4E"}15` }}
      >
        <Icon size={24} style={{ color: color || "#313A4E" }} />
      </div>
    </div>
  </div>
);

const DashboardEstudante = () => {
  const navigate = useNavigate();
  const { sidebarWidth = 300, isMobile = false } = useSidebar();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [activeTab, setActiveTab] = useState("agenda");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Dados do Usuário (Inicialização segura) ---
  const defaultUserInfo = sidebarConfigs?.aluno?.userInfo || { name: "Estudante", email: "..." }; 
  const [userInfo, setUserInfo] = useState(defaultUserInfo);

  // Estados do Dashboard
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ id: null, name: defaultUserInfo.name });
  const [schedule, setSchedule] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [latestInvoice, setLatestInvoice] = useState(null);

  const contentStyle = {
    marginLeft: isMobile ? 0 : sidebarWidth,
    width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
    paddingBottom: "2rem",
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Recarrega agenda se mudar a semana ou o ID do usuário
  useEffect(() => {
    if (userData?.id) {
      loadSchedule(userData.id);
    }
  }, [selectedWeek, userData?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. DADOS DO USUÁRIO (Essencial para Sidebar e ID)
      const userRes = await api.get("/users/me");
      // console.log(userRes.data)
      const user = userRes.data;
      
      const nomeUser = user.name_user || user.nome || "Estudante";
      const emailUser = user.email_user || user.email || "";
      const userId = user.estudante.id_estudante || user.id_user || user.id;

      // Atualiza IMEDIATAMENTE a sidebar e header
      setUserInfo({ name: nomeUser, email: emailUser, role: "Estudante" });
      setUserData({ id: userId, name: nomeUser, email: emailUser });

      if (userId) {
        // Dispara chamadas paralelas que não travam uma a outra
        await Promise.allSettled([
            loadPlanData(userId),
            loadFinancialData(userId)
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função separada para buscar Plano (Trata 404 sem erro fatal)
  const loadPlanData = async (userId) => {
    try {
        let planData = null;
        
        // Tenta buscar contrato ativo
        try {
            const res = await api.get(`/contratos/estudante/${userId}/ativo`);
            planData = res.data;
        } catch (e) { /* Ignora 404 */ }

        // Se não achou, tenta histórico
        if (!planData) {
            try {
                const resHist = await api.get(`/adesao/estudante/${userId}/historico`);
                const plans = resHist.data || [];
                planData = plans.find(p => p.status_adesao === "ATIVO") || plans[plans.length - 1];
            } catch (e) { /* Ignora 404 */ }
        }

        if (planData) {
            const today = new Date();
            const dataFim = planData.data_fim || planData.data_termino || today;
            const diffDays = Math.ceil((new Date(dataFim) - today) / (1000 * 60 * 60 * 24)); 

            setActivePlan({
                name: planData.nome_plano || planData.plano?.nome || "Plano Ativo",
                price: `R$ ${planData.valor_total || planData.valor || '0,00'}`,
                status: planData.status_adesao || "Ativo",
                dueDate: new Date(dataFim).toLocaleDateString('pt-BR'),
                daysUntilDue: diffDays > 0 ? diffDays : 0,
                id: planData.id
            });
        }
    } catch (err) {
        console.log("Sem plano encontrado (esperado para novos alunos)");
    }
  };

  // Função separada para Financeiro (Trata 404 sem erro fatal)
  const loadFinancialData = async (userId) => {
    try {
        const res = await api.get(`/pagamentos/?id_estudante=${userId}`);
        const payments = res.data || [];
        
        if (Array.isArray(payments) && payments.length > 0) {
            const sorted = payments.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
            const last = sorted[sorted.length - 1];
            
            setLatestInvoice({
                month: new Date(last.data_vencimento).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                amount: `R$ ${last.valor_pagamento || '0,00'}`,
                status: last.status === 'PAGO' ? 'paid' : (last.status === 'ATRASADO' ? 'overdue' : 'pending'),
                dueDate: new Date(last.data_vencimento).toLocaleDateString('pt-BR'),
                issueDate: last.data_pagamento ? new Date(last.data_pagamento).toLocaleDateString('pt-BR') : '---',
                id: last.id
            });
        }
    } catch (err) {
        console.log("Sem faturas encontradas (esperado para novos alunos)");
    }
  };

  const loadSchedule = async (studentId) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + (selectedWeek * 7) - today.getDay()); 
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); 

        const startStr = startOfWeek.toLocaleDateString('en-CA');
        const endStr = endOfWeek.toLocaleDateString('en-CA');

        const res = await api.get(`/agenda/minhas_aulas?start_date=${startStr}&end_date=${endStr}`);
        const aulas = res.data || [];

        const formatted = aulas.map(aula => {
            const rawDate = aula.data_aula || aula.dataAgendaAula;
            const d = new Date(rawDate);
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return {
                day: days[d.getDay()],
                date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                fullDate: d, 
                time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                type: aula.titulo_aula || aula.disciplina || "Aula",
                instructor: "Instrutor", 
                studio: aula.nome_estudio || "Estúdio"
            };
        });

        formatted.sort((a, b) => a.fullDate - b.fullDate);
        setSchedule(formatted);

        if (selectedWeek >= 0) {
            const next = formatted.find(a => a.fullDate >= new Date());
            if (next) {
                setNextClass({
                    day: next.fullDate.toDateString() === new Date().toDateString() ? "Hoje" : next.day,
                    time: next.time,
                    type: next.type,
                    instructor: next.instructor
                });
            } else setNextClass(null);
        }
    } catch (error) {
        // Se der 404 na agenda, apenas limpa
        setSchedule([]);
        setNextClass(null);
    }
  };

  const invoiceStatusConfig = {
    paid: { label: "Pago", className: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle size={16}/> },
    pending: { label: "Em aberto", className: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <AlertCircle size={16}/> },
    overdue: { label: "Vencido", className: "bg-red-100 text-red-700 border-red-200", icon: <AlertCircle size={16}/> },
  };

  const handleTabChange = (tabId) => {
    if (tabId === "planos") navigate("/aluno/planos");
    else setActiveTab(tabId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        menuItems={sidebarConfigs.aluno.menuItems}
        userInfo={userInfo}
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
      <div className="flex-1 transition-all duration-500 flex flex-col" style={contentStyle}>
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5 mt-16 md:mt-0">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Olá, {userData?.name?.split(' ')[0]}!
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Bem-vindo ao seu painel.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <InfoCard 
                    icon={Clock}
                    label="Próxima Aula"
                    value={nextClass ? `${nextClass.day} às ${nextClass.time}` : "Nenhuma aula futura"}
                    subtext={nextClass ? nextClass.type : "Verifique sua agenda"}
                    color="#2B668B"
                    loading={loading}
                />
            </div>

            {/* Abas */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                        { id: "agenda", label: "Minha Agenda", icon: CalendarIcon },
                        { id: "planos", label: "Detalhes do Plano", icon: CreditCard },
                        { id: "faturas", label: "Financeiro", icon: Receipt },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                    isActive && tab.id !== 'planos' 
                                    ? "border-blue-600 text-blue-600" 
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Conteúdo Agenda */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[400px]">
                {activeTab === "agenda" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Agenda Semanal</h2>
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                <button onClick={() => setSelectedWeek(selectedWeek - 1)} className="p-1 hover:bg-white rounded-md"><ChevronLeft size={20}/></button>
                                <span className="text-sm font-medium min-w-[100px] text-center">{selectedWeek === 0 ? "Esta Semana" : `${selectedWeek}ª Semana`}</span>
                                <button onClick={() => setSelectedWeek(selectedWeek + 1)} className="p-1 hover:bg-white rounded-md"><ChevronRight size={20}/></button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10"><Loader className="animate-spin text-gray-400" /></div>
                        ) : schedule.length > 0 ? (
                            <div className="space-y-3">
                                {schedule.map((item, index) => (
                                    <div key={index} className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 text-blue-700 rounded-lg mr-4">
                                            <span className="text-xs font-semibold uppercase">{item.day}</span>
                                            <span className="text-lg font-bold">{item.date.split('/')[0]}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{item.type}</h3>
                                            <p className="text-sm text-gray-500">{item.instructor}</p>
                                        </div>
                                        <div className="text-right text-sm text-gray-600">
                                            <div className="flex items-center justify-end gap-1"><Clock size={14} />{item.time}</div>
                                            <div className="text-xs text-gray-400">{item.studio}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <p>Nenhuma aula encontrada para esta semana.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Conteúdo Faturas */}
                {activeTab === "faturas" && (
                    <div className="max-w-2xl mx-auto">
                        {latestInvoice ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900">Fatura Recente</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${invoiceStatusConfig[latestInvoice.status]?.className}`}>
                                        {invoiceStatusConfig[latestInvoice.status]?.icon}
                                        {invoiceStatusConfig[latestInvoice.status]?.label}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-end mb-6">
                                        <div><p className="text-sm text-gray-500">Mês</p><p className="text-lg font-bold">{latestInvoice.month}</p></div>
                                        <div className="text-right"><p className="text-sm text-gray-500">Valor</p><p className="text-2xl font-bold">{latestInvoice.amount}</p></div>
                                    </div>
                                    <button className="w-full py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"><Receipt size={18}/> Pagar Agora</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>Nenhuma fatura pendente encontrada.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEstudante;