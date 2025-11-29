import SidebarUnificada from "@/components/layout/Sidebar/SidebarUnificada";
import { sidebarConfigs } from "@/components/layout/Sidebar/sidebarConfigs";
import React, { useState, useEffect, useMemo } from 'react';
import { useSidebar } from "@/context/SidebarContext";
import { ChevronDown, Building, Plus, X, Pencil, Search } from 'lucide-react';
import api from '../../services/api';

const STUDIO_MAP = {
    1: 'Estudio Itaquera',
    2: 'Estudio São Miguel',
};

const studios = [
    { id: 'Todos', name: 'Todos' },
    { id: 1, name: 'Estudio Itaquera' },
    { id: 2, name: 'Estudio São Miguel' }
];

// --- COMPONENTES AUXILIARES ---

const StudioSelector = ({ studios, selectedStudio, onSelectStudio }) => {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center text-gray-700 font-semibold">
                <Building size={20} className="mr-2" />
                <span className="mr-3">Estúdio:</span>
            </div>
            {studios.map((studio) => (
                <button
                    key={studio.id}
                    onClick={() => onSelectStudio(studio.id)}
                    className={`
                        py-2 px-5 rounded-full font-medium text-sm transition-all
                        ${selectedStudio === studio.id
                            ? 'bg-[#67AF97] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                    `}
                >
                    {studio.name}
                </button>
            ))}
        </div>
    );
};

const MonthYearSelector = ({ month, year, onMonthChange, onYearChange }) => {
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return (
        <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
            <div className="relative inline-block w-36 sm:w-40">
                <select value={month} onChange={onMonthChange} className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-lg font-medium w-full focus:outline-none focus:ring-2 focus:ring-[#67AF97]">
                    {monthNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
            </div>
            <div className="relative inline-block w-28 sm:w-32">
                <select value={year} onChange={onYearChange} className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-lg font-medium w-full focus:outline-none focus:ring-2 focus:ring-[#67AF97]">
                    {Array.from({ length: 3 }, (_, i) => 2023 + i).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
            </div>
        </div>
    );
};

const ClassCard = ({ id, title, date, time, teacher, studio, onEdit }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const cleanDate = dateString.includes('T') ? dateString.split('T')[0] : dateString;
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return `${d}/${m}/${y}`;
        }
        return dateString;
    };

    return (
        <article className="bg-[#FEFEFE] border border-black rounded-lg shadow-sm p-4 text-center flex flex-col justify-between h-auto min-h-[200px] relative group">
            <button 
                onClick={() => onEdit(id, title, teacher)}
                className="absolute top-2 right-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                title="Alterar Instrutor"
            >
                <Pencil size={16} />
            </button>
            <div>
                <h3 className="font-medium text-gray-900 leading-tight text-xl sm:text-2xl mb-2 line-clamp-2 pr-6">
                    {title}
                </h3>
                <div className="font-medium text-lg sm:text-xl text-[#67AF97] mb-2">
                    <p>{formatDate(date)}</p>
                    <p>{time && time !== "00:00" ? time : ""}</p> 
                </div>
                <p className="font-medium text-black text-base sm:text-lg line-clamp-1 mb-1">
                    {teacher}
                </p>
                <p className="font-medium text-black text-base sm:text-lg line-clamp-1">
                    {studio}
                </p>
            </div>
        </article>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function AgendaEstudio() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isMobile, sidebarWidth } = useSidebar();

    const [allClasses, setAllClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [selectedStudio, setSelectedStudio] = useState('Todos');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Estados de UI e Dados
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [instructors, setInstructors] = useState([]);
    const [students, setStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false); 
    const [studentSearchTerm, setStudentSearchTerm] = useState(""); 
    
    const [editingClass, setEditingClass] = useState({ id: null, title: '', teacherName: '' });
    const [selectedInstructorForEdit, setSelectedInstructorForEdit] = useState("");

    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        titulo_aula: '',
        disciplina: '',
        data_aula: today,
        horario: '',
        duracao_minutos: '60',
        fk_id_estudio: '',
        fk_id_professor: '',
        desc_aula: '',
        estudantes_selecionados: []
    });

    // 1. Carregamento Inicial
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const instrResponse = await api.get('/instrutores/');
                setInstructors(instrResponse.data || []);
            } catch (error) {
                console.error("Erro ao buscar instrutores:", error);
            }
        };
        fetchInitialData();
        fetchStudentsBackground();
    }, []);

    // 2. Carregamento de Alunos em Background
    const fetchStudentsBackground = async () => {
        setIsLoadingStudents(true);
        try {
            const studentsResponse = await api.get('/alunos/', { timeout: 20000 });
            setStudents(studentsResponse.data || []);
        } catch (error) {
            console.error("Erro ao buscar alunos em background:", error);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const instructorMap = useMemo(() => {
        const map = {};
        instructors.forEach(user => {
            if (user.professor && user.professor.id_professor) {
                map[user.professor.id_professor] = user.name_user;
            }
        });
        return map;
    }, [instructors]);

    // 3. Busca da Agenda (Via SQL)
    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);

            try {
                const response = await api.get('/aulas/'); 
                const todasAsAulas = response.data || [];

                const aulasFiltradasPorData = todasAsAulas.filter(aula => {
                    const dataString = aula.data_aula || aula.dataAgendaAula || aula.start || "";
                    if (!dataString) return false;

                    const cleanDate = dataString.includes('T') ? dataString.split('T')[0] : dataString;
                    const parts = cleanDate.split('-');
                    
                    if(parts.length < 3) return false;

                    const ano = parseInt(parts[0], 10);
                    const mes = parseInt(parts[1], 10) - 1; 

                    return ano === currentYear && mes === currentMonth;
                });

                setAllClasses(aulasFiltradasPorData);

            } catch (error) {
                console.error("Erro ao buscar aulas no SQL:", error);
                setAllClasses([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClasses();
    }, [currentMonth, currentYear, refreshKey]);

    const handleMonthChange = (e) => setCurrentMonth(parseInt(e.target.value));
    const handleYearChange = (e) => setCurrentYear(parseInt(e.target.value));
    const handleStudioChange = (studioId) => setSelectedStudio(studioId);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStudentToggle = (studentId) => {
        setFormData(prev => {
            const isSelected = prev.estudantes_selecionados.includes(studentId);
            if (isSelected) {
                return { ...prev, estudantes_selecionados: prev.estudantes_selecionados.filter(id => id !== studentId) };
            } else {
                return { ...prev, estudantes_selecionados: [...prev.estudantes_selecionados, studentId] };
            }
        });
    };

    // --- CRIAÇÃO DE AULA (ENVIO CORRIGIDO) ---
    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            if (!formData.fk_id_professor || !formData.titulo_aula) {
                alert("Por favor, preencha todos os campos obrigatórios.");
                return;
            }

            // Montamos uma string ISO completa para o campo data_aula
            const dataCompletaISO = `${formData.data_aula}T${formData.horario}:00`;

            const payload = {
                fk_id_professor: parseInt(formData.fk_id_professor, 10),
                fk_id_estudio: parseInt(formData.fk_id_estudio, 10),
                titulo_aula: formData.titulo_aula,
                desc_aula: formData.desc_aula || `Aula de ${formData.titulo_aula}`,
                duracao_minutos: parseInt(formData.duracao_minutos, 10),
                disciplina: formData.disciplina || formData.titulo_aula,
                
                data_aula: dataCompletaISO, 
                horario_inicio: formData.horario,
                dataAgendaAula: dataCompletaISO, 
                estudantes_a_matricular: formData.estudantes_selecionados.map(id => parseInt(id, 10))
            };

            await api.post('/aulas/', payload);

            alert('Aula criada com sucesso!');
            setIsModalOpen(false);
            
            const parts = formData.data_aula.split('-');
            const anoCriado = parseInt(parts[0], 10);
            const mesCriado = parseInt(parts[1], 10) - 1;
            
            setCurrentYear(anoCriado);
            setCurrentMonth(mesCriado);
            setRefreshKey(prev => prev + 1);

            setFormData({
                titulo_aula: '', disciplina: '', data_aula: today, horario: '',
                duracao_minutos: '60', fk_id_estudio: '', fk_id_professor: '',
                desc_aula: '', estudantes_selecionados: []
            });
        } catch (error) {
            console.error("Erro ao criar aula:", error);
            const msg = error.response?.data?.detail || "Erro desconhecido ao criar aula.";
            alert(`Erro: ${msg}`);
        }
    };

    const openEditModal = (id, title, currentTeacherName) => {
        setEditingClass({ id, title, teacherName: currentTeacherName });
        setSelectedInstructorForEdit(""); 
        setIsEditModalOpen(true);
    };

    const handleUpdateInstructor = async (e) => {
        e.preventDefault();
        if (!selectedInstructorForEdit) {
            alert("Selecione um instrutor.");
            return;
        }

        try {
            const payload = {
                fk_id_professor: parseInt(selectedInstructorForEdit, 10)
            };

            await api.patch(`/aulas/${editingClass.id}`, payload);

            alert("Instrutor atualizado com sucesso!");
            setIsEditModalOpen(false);
            setRefreshKey(prev => prev + 1); 
        } catch (error) {
            console.error("Erro ao atualizar instrutor:", error);
            const msg = error.response?.data?.detail || "Erro ao atualizar.";
            alert(`Erro: ${msg}`);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!studentSearchTerm) return students;
        return students.filter(student => 
            student.name_user.toLowerCase().includes(studentSearchTerm.toLowerCase())
        );
    }, [students, studentSearchTerm]);

    // LÓGICA DE MAPEAMENTO (EXTRAÇÃO DE HORA)
    const filteredAndMappedClasses = allClasses
        .filter(aula => {
            if (selectedStudio === 'Todos') return true;
            const idEstudioAula = aula.EstudioID || aula.fk_id_estudio || aula.estudio_id || aula.estudio?.id;
            return idEstudioAula == selectedStudio;
        })
        .map(aula => {
            const profId = aula.professorResponsavel || aula.fk_id_professor;
            const profName = instructorMap[profId] || (profId ? `Instrutor ID: ${profId}` : "Sem Instrutor");

            const dataReal = aula.dataAgendaAula || aula.data_aula || aula.start || "";

            let time = "00:00";

            const rawTime = aula.horario_inicio || aula.horarioInicio || aula.horario || aula.time;

            if (rawTime) {
                time = String(rawTime).substring(0, 5);
            } 
            else if (dataReal && dataReal.includes('T')) {
                const extracted = dataReal.split('T')[1].substring(0, 5);
                if (extracted !== "00:00") {
                    time = extracted;
                }
            }

            const idEstudioAula = aula.EstudioID || aula.fk_id_estudio || aula.estudio_id;

            return {
                id: aula.AulaID || aula._id || aula.id_aula,
                title: aula.disciplina || aula.titulo_aula || "Sem Título",
                date: dataReal,
                time: time,
                teacher: profName,
                studio: STUDIO_MAP[idEstudioAula] || "Estúdio Desconhecido"
            };
        });

    return (
        <div className="flex min-h-screen bg-gray-50 font-inter">
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
                <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
                    <div className="bg-white rounded-lg shadow-lg flex flex-col p-4 sm:p-6 lg:p-8 w-full max-w-full lg:max-w-7xl mx-auto relative">

                    <div className="flex items-center gap-3 mb-6 mt-16 sm:mt-0">
                        <h1 className="font-semibold text-gray-900 text-2xl sm:text-3xl lg:text-4xl">
                            Agenda de Aulas
                        </h1>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4 sm:mt-0 sm:absolute sm:right-0 bg-[#67AF97] hover:bg-[#559e85] text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Plus size={20} />
                                <span className="font-medium">Nova Aula</span>
                            </button>
                        </div>

                        <StudioSelector 
                            studios={studios}
                            selectedStudio={selectedStudio}
                            onSelectStudio={handleStudioChange}
                        />

                        <div className="mb-8">
                            <MonthYearSelector 
                                month={currentMonth} 
                                year={currentYear} 
                                onMonthChange={handleMonthChange} 
                                onYearChange={handleYearChange}
                            />
                        </div>

                        <div>
                            {isLoading ? (
                                <p className="col-span-full text-center text-gray-500 text-lg">Carregando aulas...</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {filteredAndMappedClasses.length > 0 ? (
                                        filteredAndMappedClasses.map((c) => (
                                            <ClassCard
                                                key={c.id}
                                                id={c.id}
                                                title={c.title}
                                                date={c.date}
                                                time={c.time} 
                                                teacher={c.teacher}
                                                studio={c.studio}
                                                onEdit={openEditModal}
                                            />
                                        ))
                                    ) : (
                                        <p className="col-span-full text-center text-gray-500 text-lg">
                                            Nenhuma aula encontrada para esta seleção.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* MODAIS */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center bg-[#67AF97] p-4 text-white">
                            <h3 className="text-xl font-semibold">Criar Nova Aula</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateClass} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título da Aula *</label>
                                    <input type="text" name="titulo_aula" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.titulo_aula} onChange={handleInputChange} placeholder="Ex: Yoga Iniciante" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                                    <input type="text" name="disciplina" className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.disciplina} onChange={handleInputChange} placeholder="Ex: Yoga" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                                    <input type="date" name="data_aula" required min={today} className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.data_aula} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário *</label>
                                    <input type="time" name="horario" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.horario} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos) *</label>
                                    <input type="number" name="duracao_minutos" min="5" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.duracao_minutos} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estúdio *</label>
                                    <select name="fk_id_estudio" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.fk_id_estudio} onChange={handleInputChange}>
                                        <option value="">Selecione...</option>
                                        {studios.filter(s => s.id !== 'Todos').map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor *</label>
                                    <select name="fk_id_professor" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.fk_id_professor} onChange={handleInputChange}>
                                        <option value="">Selecione...</option>
                                        {instructors.map(instr => {
                                            if (!instr.professor?.id_professor) return null;
                                            return (<option key={instr.id_user} value={instr.professor.id_professor}>{instr.name_user}</option>);
                                        })}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alunos (Opcional)</label>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
                                        <input type="text" placeholder="Buscar aluno por nome..." value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md pl-8 p-2 text-sm" />
                                    </div>
                                    <div className="w-full border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                                        {isLoadingStudents && students.length === 0 ? (<span className="text-sm text-gray-500 animate-pulse">Carregando lista de alunos...</span>) : filteredStudents.length === 0 ? (<span className="text-sm text-gray-500">{students.length === 0 ? "Nenhum aluno encontrado." : "Nenhum aluno com esse nome."}</span>) : (filteredStudents.map(student => { const studentId = student.estudante?.id_estudante; if (!studentId) return null; return (<div key={student.id_user} className="flex items-center mb-2 hover:bg-gray-50 p-1 rounded"><input type="checkbox" id={`student-${studentId}`} value={studentId} checked={formData.estudantes_selecionados.includes(studentId)} onChange={() => handleStudentToggle(studentId)} className="mr-2 h-4 w-4 text-[#67AF97]" /><label htmlFor={`student-${studentId}`} className="text-sm text-gray-700 w-full cursor-pointer select-none">{student.name_user}</label></div>); }))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Total carregado: {students.length} alunos.</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea name="desc_aula" rows={3} className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97]" value={formData.desc_aula} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-3 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-[#67AF97] text-white rounded-md hover:bg-[#559e85]">Criar Aula</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center bg-[#67AF97] p-4 text-white">
                            <h3 className="text-lg font-semibold">Definir Instrutor</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">Aula:</p>
                                <p className="font-medium text-gray-900">{editingClass.title}</p>
                            </div>
                            <div className="mb-6">
                                <p className="text-sm text-gray-500">Instrutor Atual:</p>
                                <p className="font-medium text-gray-900">{editingClass.teacherName}</p>
                            </div>
                            <form onSubmit={handleUpdateInstructor}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Novo Instrutor</label>
                                <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#67AF97] focus:border-[#67AF97] mb-6" value={selectedInstructorForEdit} onChange={(e) => setSelectedInstructorForEdit(e.target.value)} required>
                                    <option value="">Selecione...</option>
                                    {instructors.map(instr => { if (!instr.professor?.id_professor) return null; return (<option key={instr.id_user} value={instr.professor.id_professor}>{instr.name_user}</option>); })}
                                </select>
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="mr-3 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-[#67AF97] text-white rounded-md hover:bg-[#559e85]">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}