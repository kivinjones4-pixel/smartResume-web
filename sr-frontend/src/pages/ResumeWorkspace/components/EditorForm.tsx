import { ThunderboltOutlined } from '@ant-design/icons'
import { Button, Checkbox, Form, Input, Select } from 'antd'
import type { FormInstance } from 'antd'
import type { Ref } from 'react'
import type {
  AwardFormValues,
  BasicProfileValues,
  EducationFormValues,
  InternshipFormValues,
  ProjectFormValues,
  WorkFormValues,
} from '../../../types/Resume'
import type { ResumeModuleKey } from '../../../types/ResumeWorkspace'

const { TextArea } = Input

type EditorFormProps = {
  moduleKey: ResumeModuleKey
  form: ReturnType<typeof Form.useForm<BasicProfileValues>>[0]
  educationFormRef: Ref<FormInstance<EducationFormValues>>
  internshipFormRef: Ref<FormInstance<InternshipFormValues>>
  workFormRef: Ref<FormInstance<WorkFormValues>>
  projectFormRef: Ref<FormInstance<ProjectFormValues>>
  awardFormRef: Ref<FormInstance<AwardFormValues>>
  educationFormKey: string
  educationInitialValues: Partial<EducationFormValues>
  internshipFormKey: string
  internshipInitialValues: Partial<InternshipFormValues>
  workFormKey: string
  workInitialValues: Partial<WorkFormValues>
  projectFormKey: string
  projectInitialValues: Partial<ProjectFormValues>
  awardFormKey: string
  awardInitialValues: Partial<AwardFormValues>
  hasSelectedResume: boolean
}

export default function EditorForm({
  moduleKey,
  form,
  educationFormRef,
  internshipFormRef,
  workFormRef,
  projectFormRef,
  awardFormRef,
  educationFormKey,
  educationInitialValues,
  internshipFormKey,
  internshipInitialValues,
  workFormKey,
  workInitialValues,
  projectFormKey,
  projectInitialValues,
  awardFormKey,
  awardInitialValues,
  hasSelectedResume,
}: EditorFormProps) {
  if (moduleKey === 'profile') {
    return (
      <Form form={form} layout="vertical" requiredMark>
        <Form.Item
          label="真实姓名"
          name="full_name"
          rules={[{ required: true, whitespace: true, message: '请输入真实姓名' }]}
        >
          <Input placeholder="请输入真实姓名" maxLength={100} />
        </Form.Item>
        <Form.Item
          label="性别"
          name="gender"
          rules={[{ required: true, message: '请选择性别' }]}
        >
          <Select
            placeholder="请选择性别"
            options={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'other', label: '其他' },
              { value: 'undisclosed', label: '不愿透露' },
            ]}
          />
        </Form.Item>
        {hasSelectedResume && (
          <Form.Item
            label="求职方向"
            name="target_position"
            rules={[{ required: true, whitespace: true, message: '请输入求职方向' }]}
          >
            <Input placeholder="例如：高级产品经理" maxLength={150} />
          </Form.Item>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="联系电话" name="contact_phone">
            <Input placeholder="联系电话" />
          </Form.Item>
          <Form.Item label="所在城市" name="location">
            <Input placeholder="所在城市" />
          </Form.Item>
        </div>
        <Form.Item
          label="联系邮箱"
          name="contact_email"
          rules={[{ type: 'email', message: '请输入有效的联系邮箱' }]}
        >
          <Input placeholder="联系邮箱" />
        </Form.Item>
        <Form.Item label="职业标题" name="headline">
          <Input placeholder="例如：6 年经验的 AI 产品经理" />
        </Form.Item>
        <Form.Item
          label="GitHub URL"
          name="github_url"
          rules={[{ type: 'url', message: '请输入有效的 GitHub URL' }]}
        >
          <Input placeholder="https://github.com/username" />
        </Form.Item>
        <Form.Item
          label="个人网站 URL"
          name="website_url"
          rules={[{ type: 'url', message: '请输入有效的网站 URL' }]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>
        <Form.Item label="出生日期" name="birth_date">
          <Input type="date" />
        </Form.Item>
        <Form.Item label="个人优势" name="summary">
          <TextArea rows={7} placeholder="介绍你的经验、优势和职业亮点" />
        </Form.Item>
      </Form>
    )
  }

  if (moduleKey === 'education') {
    return (
      <Form
        key={educationFormKey}
        ref={educationFormRef}
        initialValues={educationInitialValues}
        layout="vertical"
        requiredMark
      >
        <Form.Item
          label="学校名称"
          name="school_name"
          rules={[{ required: true, whitespace: true, message: '请输入学校名称' }]}
        >
          <Input placeholder="例如：华南理工大学" maxLength={200} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="学历" name="degree">
            <Input placeholder="例如：本科" maxLength={100} />
          </Form.Item>
          <Form.Item label="专业" name="field_of_study">
            <Input placeholder="例如：计算机科学" maxLength={150} />
          </Form.Item>
        </div>
        <Form.Item label="所在地" name="location">
          <Input placeholder="例如：广州" maxLength={150} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            label="开始时间"
            name="start_date"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <Input type="month" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.is_current !== current.is_current}>
            {({ getFieldValue }) => (
              <Form.Item
                label="结束时间"
                name="end_date"
                rules={[
                  {
                    validator: (_, value) =>
                      getFieldValue('is_current') || value
                        ? Promise.resolve()
                        : Promise.reject(new Error('请选择结束时间或勾选至今')),
                  },
                ]}
              >
                <Input type="month" disabled={getFieldValue('is_current')} />
              </Form.Item>
            )}
          </Form.Item>
        </div>
        <Form.Item name="is_current" valuePropName="checked">
          <Checkbox>至今（在读）</Checkbox>
        </Form.Item>
        <Form.Item label="GPA" name="gpa">
          <Input placeholder="例如：3.8 / 4.0" maxLength={32} />
        </Form.Item>
        <Form.Item label="经历描述" name="description">
          <TextArea rows={7} placeholder="课程、研究方向、校园活动或取得的成果" />
        </Form.Item>
        <Button block icon={<ThunderboltOutlined />}>
          AI 帮我润色
        </Button>
      </Form>
    )
  }

  if (moduleKey === 'internship' || moduleKey === 'work') {
    const isWork = moduleKey === 'work'
    return (
      <Form
        key={isWork ? workFormKey : internshipFormKey}
        ref={isWork ? workFormRef : internshipFormRef}
        initialValues={isWork ? workInitialValues : internshipInitialValues}
        layout="vertical"
        requiredMark
      >
        <Form.Item
          label="公司名称"
          name="company_name"
          rules={[{ required: true, whitespace: true, message: '请输入公司名称' }]}
        >
          <Input placeholder="例如：字节跳动" maxLength={200} />
        </Form.Item>
        <Form.Item
          label="职位"
          name="position_title"
          rules={[{ required: true, whitespace: true, message: '请输入职位' }]}
        >
          <Input placeholder={isWork ? '例如：高级产品经理' : '例如：产品实习生'} maxLength={150} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="部门" name="department">
            <Input placeholder="例如：商业产品部" maxLength={150} />
          </Form.Item>
          <Form.Item label="地点" name="location">
            <Input placeholder="例如：北京" maxLength={150} />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            label="开始时间"
            name="start_date"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <Input type="month" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.is_current !== current.is_current}>
            {({ getFieldValue }) => (
              <Form.Item
                label="结束时间"
                name="end_date"
                rules={[
                  {
                    validator: (_, value) =>
                      getFieldValue('is_current') || value
                        ? Promise.resolve()
                        : Promise.reject(new Error('请选择结束时间或勾选仍在职')),
                  },
                ]}
              >
                <Input type="month" disabled={getFieldValue('is_current')} />
              </Form.Item>
            )}
          </Form.Item>
        </div>
        <Form.Item name="is_current" valuePropName="checked">
          <Checkbox>至今（仍在职）</Checkbox>
        </Form.Item>
        <Form.Item
          label="成就"
          name="achievements"
          extra="每行填写一项成就"
        >
          <TextArea rows={5} placeholder={'例如：推动核心功能上线，转化率提升 15%；独立完成 20 场用户访谈'} />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <TextArea rows={7} placeholder="描述工作职责、项目内容和产出" />
        </Form.Item>
        <Button block icon={<ThunderboltOutlined />}>
          AI 帮我润色
        </Button>
      </Form>
    )
  }

  if (moduleKey === 'project') {
    return (
      <Form
        key={projectFormKey}
        ref={projectFormRef}
        initialValues={projectInitialValues}
        layout="vertical"
        requiredMark
      >
        <Form.Item
          label="项目名"
          name="project_name"
          rules={[{ required: true, whitespace: true, message: '请输入项目名' }]}
        >
          <Input placeholder="例如：AI 智能简历平台" maxLength={200} />
        </Form.Item>
        <Form.Item
          label="担任角色"
          name="role_name"
          rules={[{ required: true, whitespace: true, message: '请输入担任角色' }]}
        >
          <Input placeholder="例如：产品负责人" maxLength={150} />
        </Form.Item>
        <Form.Item
          label="项目地址"
          name="project_url"
          rules={[{ type: 'url', message: '请输入有效的项目地址' }]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>
        <Form.Item
          label="仓库地址"
          name="repository_url"
          rules={[{ type: 'url', message: '请输入有效的仓库地址' }]}
        >
          <Input placeholder="https://github.com/username/project" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            label="开始时间"
            name="start_date"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <Input type="month" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.is_current !== current.is_current}>
            {({ getFieldValue }) => (
              <Form.Item
                label="结束时间"
                name="end_date"
                rules={[
                  {
                    validator: (_, value) =>
                      getFieldValue('is_current') || value
                        ? Promise.resolve()
                        : Promise.reject(new Error('请选择结束时间或勾选至今')),
                  },
                ]}
              >
                <Input type="month" disabled={getFieldValue('is_current')} />
              </Form.Item>
            )}
          </Form.Item>
        </div>
        <Form.Item name="is_current" valuePropName="checked">
          <Checkbox>至今（仍在进行）</Checkbox>
        </Form.Item>
        <Form.Item label="成就" name="achievements" extra="每行填写一项成就">
          <TextArea rows={5} placeholder={'例如：\\n核心流程转化率提升 20%\\n项目获得 1,000 名用户'} />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <TextArea rows={7} placeholder="描述项目背景、职责、方案和成果" />
        </Form.Item>
        <Button block icon={<ThunderboltOutlined />}>
          AI 帮我润色
        </Button>
      </Form>
    )
  }

  if (moduleKey === 'award') {
    return (
      <Form
        key={awardFormKey}
        ref={awardFormRef}
        initialValues={awardInitialValues}
        layout="vertical"
        requiredMark
      >
        <Form.Item
          label="奖项名称"
          name="award_name"
          rules={[{ required: true, whitespace: true, message: '请输入奖项名称' }]}
        >
          <Input placeholder="例如：全国大学生创新创业大赛金奖" maxLength={200} />
        </Form.Item>
        <Form.Item
          label="颁发机构"
          name="issuer"
          rules={[{ required: true, whitespace: true, message: '请输入颁发机构' }]}
        >
          <Input placeholder="例如：教育部" maxLength={200} />
        </Form.Item>
        <Form.Item
          label="证书地址"
          name="certificate_url"
          rules={[{ type: 'url', message: '请输入有效的证书地址' }]}
        >
          <Input placeholder="https://example.com/certificate" />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <TextArea rows={7} placeholder="描述奖项背景、评选范围和取得的成果" />
        </Form.Item>
        <Button block icon={<ThunderboltOutlined />}>
          AI 帮我润色
        </Button>
      </Form>
    )
  }

  return null
}
