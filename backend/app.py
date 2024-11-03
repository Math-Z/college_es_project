from flask import Flask, request, jsonify
from flask_cors import CORS
from bson import ObjectId
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# Conectar ao MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client['esdb']
users_collection = db['users']
classes_collection = db['classes']
subjects_collection = db['subjects']
scores_collection = db['scores']

# Dados iniciais
initial_classes = [
    {"turma": "101M", "periodo": "manhã"},
    {"turma": "102M", "periodo": "manhã"},
    {"turma": "103M", "periodo": "manhã"},
    {"turma": "201M", "periodo": "manhã"},
    {"turma": "202M", "periodo": "manhã"},
    {"turma": "203M", "periodo": "manhã"},
    {"turma": "301M", "periodo": "manhã"},
    {"turma": "302M", "periodo": "manhã"},
    {"turma": "303M", "periodo": "manhã"},
    {"turma": "101T", "periodo": "tarde"},
    {"turma": "102T", "periodo": "tarde"},
    {"turma": "103T", "periodo": "tarde"},
    {"turma": "201T", "periodo": "tarde"},
    {"turma": "202T", "periodo": "tarde"},
    {"turma": "203T", "periodo": "tarde"},
    {"turma": "301T", "periodo": "tarde"},
    {"turma": "302T", "periodo": "tarde"},
    {"turma": "303T", "periodo": "tarde"}
]

initial_subjects = [
    {"name": "Matemática"},
    {"name": "Português"},
    {"name": "Inglês"},
    {"name": "Ciências"},
    {"name": "História"},
    {"name": "Geografia"},
    {"name": "Artes"},
    {"name": "Educação Física"}
]

# Dados iniciais para a coleção `users` com três tipos de usuários
initial_users = [
    {
        "username": "admin",
        "password": generate_password_hash("admin123"),
        "role": "admin"
    },
    {
        "username": "aluno",
        "password": generate_password_hash("aluno123"),
        "role": "student",
        "class": "101M"
    },
    {
        "username": "professor",
        "password": generate_password_hash("prof123"),
        "role": "teacher",
        "subject": "Matemática"
    }
]

# Função para inicializar o banco com dados padrão, se necessário
def initialize_database():
    if classes_collection.count_documents({}) == 0:
        classes_collection.insert_many(initial_classes)
        print("Dados iniciais de turmas inseridos.")
    else:
        print("Dados de turmas já existentes.")

    if subjects_collection.count_documents({}) == 0:
        subjects_collection.insert_many(initial_subjects)
        print("Dados iniciais de matérias inseridos.")
    else:
        print("Dados de matérias já existentes.")

    # Adicionar dados iniciais em `scores` caso a coleção esteja vazia
    if scores_collection.count_documents({}) == 0:
        student = users_collection.find_one({"username": "aluno", "role": "student"})
        if student:
            initial_scores = {
                "student": student["_id"],
                "scores": {
                    "Matemática": [7, 7, 8, 8.5],  # Notas padrão como 0
                    "Português": [8, 7.5, 7, 8],
                    "Inglês": [9, 9.5, 9, 10],
                    "Ciências": [6.5, 7, 7, 8],
                    "História": [7, 8, 7.5, 7],
                    "Geografia": [5, 7, 7.5, 7.5],
                    "Artes": [10, 10, 10, 9.5],
                    "Educação Física": [8, 7, 8, 9]
                }
            }
            scores_collection.insert_one(initial_scores)
            print("Dados iniciais de notas inseridos para o aluno.")
        else:
            print("Nenhum aluno encontrado para associar as notas iniciais.")
    else:
        print("Dados de notas já existentes.")

    # Inicializar usuários padrão se não existirem
    for user in initial_users:
        if not users_collection.find_one({"username": user["username"]}):
            users_collection.insert_one(user)
            print(f"Usuário inicial '{user['username']}' criado.")
        else:
            print(f"Usuário '{user['username']}' já existe.")

# Executar a inicialização do banco
initialize_database()

# Função para verificar se a turma existe
def class_exists(name):
    return classes_collection.find_one({"turma": name}) is not None

def subject_exists(name):
    return subjects_collection.find_one({"nome": name}) is not None

# Rota de registro
@app.route('/')
def home():
    return "API do Flask está funcionando!"

# Rota de registro
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')  # "student", "teacher", "admin"
    student_class = data.get('class')  # Requerido se o papel for aluno
    subject = data.get('subject')  # Requerido se o papel for professor

    print(f"Received data: username={username}, role={role}, class={student_class}, subject={subject}")

    # Verificar campos obrigatórios
    if not username or not password or not role:
        return jsonify({"error": "Todos os campos são obrigatórios!"}), 400

    # Verificar se o usuário já existe
    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Usuário já existe!"}), 400

    # Validação para alunos e professores
    if role == 'student':
        if not student_class or not class_exists(student_class):
            return jsonify({"error": "Turma inexistente!"}), 400
    elif role == 'teacher':
        if not subject or not subject_exists(subject):
            return jsonify({"error": "Matéria inexistente!"}), 400

    # Hash da senha e salvar o usuário
    hashed_password = generate_password_hash(password)
    user_data = {
        "username": username,
        "password": hashed_password,
        "role": role
    }

    # Adicionar turma ou matéria ao documento do usuário
    if role == 'student':
        user_data['class'] = student_class
    elif role == 'teacher':
        user_data['subject'] = subject

    # Inserir o novo usuário na coleção
    new_user = users_collection.insert_one(user_data)

    # Criar entrada na tabela de scores com o ID do aluno recém-criado
    if role == 'student':
        initial_scores = {
            "student": new_user.inserted_id,
            "scores": {
                "Matemática": [None, None, None, None],  # Notas padrão como None
                "Português": [None, None, None, None],
                "Inglês": [None, None, None, None],
                "Ciências": [None, None, None, None],
                "História": [None, None, None, None],
                "Geografia": [None, None, None, None],
                "Artes": [None, None, None, None],
                "Educação Física": [None, None, None, None]
            }
        }
        scores_collection.insert_one(initial_scores)

    return jsonify({"message": "Registro feito com sucesso!"}), 201



# Rota de login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Todos os campos são obrigatórios!"}), 400

    user = users_collection.find_one({"username": username})
    if user and check_password_hash(user['password'], password):
        # Cria um dicionário com as informações do usuário, incluindo o ID e excluindo a senha
        user_data = {key: user[key] for key in user if key != 'password'}
        user_data['_id'] = str(user['_id'])  # Adiciona o ID como string
        return jsonify(user_data), 200
    else:
        return jsonify({"error": "Campos inválidos!"}), 401

# Rota para listar turmas
@app.route('/api/classes', methods=['GET'])
def list_classes():
    classes = list(classes_collection.find())
    for cls in classes:
        cls['_id'] = str(cls['_id'])  # Converte ObjectId para string
    return jsonify(classes)

# Rota para listar matérias
@app.route('/api/subjects', methods=['GET'])
def list_subjects():
    subjects = list(subjects_collection.find())
    for subj in subjects:
        subj['_id'] = str(subj['_id'])  # Converte ObjectId para string
    return jsonify(subjects)

def serialize_score(score):
    """Converte os campos de um score para que sejam JSON serializáveis."""
    score['_id'] = str(score['_id'])  # Converte ObjectId para string
    # Verifica e converte outros campos, se necessário
    for key, value in score.items():
        if isinstance(value, ObjectId):
            score[key] = str(value)
    return score

@app.route('/api/scores', methods=['GET'])
def list_scores():
    try:
        scores = list(scores_collection.find())
        scores = [serialize_score(score) for score in scores]  # Aplica a serialização
        return jsonify(scores)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Rota para listar usuários do tipo estudante
@app.route('/api/students', methods=['GET'])
def list_students():
    students = list(users_collection.find({"role": "student"}))
    for student in students:
        student['_id'] = str(student['_id'])  # Converte ObjectId para string
        # Remova a senha do retorno se estiver presente
        student.pop('password', None)  # Evita que a senha seja exposta
    return jsonify(students), 200

if __name__ == '__main__':
    initialize_database()
    app.run(debug=True)
