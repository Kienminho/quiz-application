import React, { useState, useEffect, useMemo } from 'react';
import { Button, Radio, Space, Spin, message, Modal } from 'antd';
import { useStartCompetition } from '~/features/competition/hooks/use-start-competition';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment'; // Add moment.js for easier date formatting
import { useLocation } from 'react-router-dom';
import { useSubmitAnswer } from '~/features/competition/hooks/use-submit-answer';
import { ISubmitAnswer } from '~/types';

const Quiz = () => {
  const { data: questionsData, isFetching } = useStartCompetition();
  const { mutate: callSubmitAnswer } = useSubmitAnswer();
  const { state } = useLocation(); // Retrieve state from location

  const questions = useMemo(() => questionsData?.data?.questions || [], [questionsData]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [detailedResults, setDetailedResults] = useState([]);
  const [score, setScore] = useState(0);

  const testDuration = null; // Set this to null for no time limit
  const [remainingTime, setRemainingTime] = useState(testDuration ? testDuration * 60 : null); // Convert to seconds

  // New state variables for start and finish time
  const [startTime, setStartTime] = useState(null);
  const [finishTime, setFinishTime] = useState(null);

  useEffect(() => {
    if (questions.length > 0 && !startTime) {
      setSelectedOptions(Array(questions?.length).fill(null));
      // Set start time when questions are loaded
      setStartTime(moment().format('YYYY-MM-DD HH:mm:ss'));
    }

    if (testDuration) {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmit(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [questions, testDuration]);

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSelectOption = (e) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentQuestion] = e.target.value;
    setSelectedOptions(newSelectedOptions);
  };

  const handleQuickNav = (index) => {
    setCurrentQuestion(index);
  };

  const handleSubmit = (autoSubmit = false) => {
    const finishTime = moment().format('YYYY-MM-DD HH:mm:ss'); // Set finish time before processing results
    setFinishTime(finishTime);

    let calculatedScore = 0;
    const resultData = questions.map((question, index) => {
      const isCorrect = question.answers[selectedOptions[index]]?.isCorrect;
      if (isCorrect) {
        calculatedScore += 1;
      }
      return {
        question: question.title,
        chooseAnswer: selectedOptions[index],
        correctAnswer: question.answers.find((answer) => answer.isCorrect)?.answer,
        isCorrect: isCorrect
      };
    });
    setResults(resultData);

    const detailedResultData = questions.map((question, index) => ({
      questionId: question.id,
      chosenAnswerId: question.answers[selectedOptions[index]]?.id,
      typeQuestion: 'MC'
    }));
    setDetailedResults(detailedResultData);

    setScore(calculatedScore);

    if (!autoSubmit) {
      message.success('Bài kiểm tra đã được nộp!');
    }

    const participant = {
      ...state?.participant,
      idSubUnit: 4,
      startTime: startTime,
      finishTime: finishTime
    };

    const finalData: ISubmitAnswer = {
      participant,
      results: detailedResultData
    };

    console.log(finishTime);
    console.log(finalData);

    callSubmitAnswer(finalData);
  };

  const showConfirmSubmitModal = () => {
    Modal.confirm({
      title: 'Thông báo',
      content: `Bạn đã hoàn thành ${selectedOptions.filter((option) => option !== null).length} / ${questions.length} câu hỏi. Bạn có muốn nộp bài thi này?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: handleSubmit
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  console.log(detailedResults);

  useEffect(() => {
    if (startTime && finishTime) {
      console.log(`Start Time: ${startTime}`);
      console.log(`Finish Time: ${finishTime}`);
    }
  }, [startTime, finishTime]);

  return (
    <div>
      <div className='bg-cyan-700 sticky min-h-[80px] text-base top-0 z-10 flex items-center'>
        <div className='grow flex justify-between items-center py-5 px-3 h-full'>
          <div className='flex text-lg text-white'>
            <span>{currentQuestion + 1}</span>
            <span>&nbsp;/&nbsp;</span>
            <span>{questions.length}</span>
            <span>&nbsp;câu</span>
          </div>
          <div className='bg-white text-theme-color py-1 px-3 text-center min-w-[100px] rounded-2xl'>
            {testDuration ? formatTime(remainingTime) : 'Không giới hạn'}
          </div>
        </div>
      </div>
      {!isFetching ? (
        <div style={{ minHeight: `calc(100vh - 80px)` }} className='bg-white rounded-t-3xl md:rounded-none'>
          <div className='grid grid-cols-12 md:gap-4 p-4 text-sm lg:text-base'>
            <div className='col-span-12 md:col-span-4 xl:col-span-3 sticky top-[80px] px-0 z-[1] md:order-2'>
              <Button className='uppercase text-base font-light w-full py-5' onClick={showConfirmSubmitModal}>
                Nộp bài
              </Button>
              <div className='flex overflow-auto py-2 bg-white md:flex-wrap md:border rounded-xl md:p-4 md:justify-center'>
                {questions.map((_, index) => (
                  <div key={index} className='flex flex-col items-center'>
                    <Button
                      shape='circle'
                      onClick={() => handleQuickNav(index)}
                      type={index === currentQuestion ? 'primary' : 'default'}
                      style={{
                        backgroundColor: selectedOptions[index] !== null ? '#0e76aa' : 'lightgray',
                        borderColor: selectedOptions[index] !== null ? '#0e76aa' : 'lightgray',
                        color: 'white',
                        margin: '0 5px'
                      }}
                    >
                      {index + 1}
                    </Button>
                    {index === currentQuestion && <div className='solid #0e76aa'>_</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className='relative col-span-12 md:col-span-8 xl:col-span-9 md:border rounded-xl p-4 md:order-1'>
              <div className='hidden sticky top-[250px] left-0 md:flex items-center justify-center w-12 h-12 text-slate-500 border border-slate-500 rounded-full mx-0'>
                <Button
                  type='link'
                  onClick={handlePrev}
                  shape='circle'
                  icon={<ChevronLeft />}
                  disabled={currentQuestion === 0}
                />
              </div>
              <div className='hidden sticky top-[250px] left-[calc(100%-48px)] md:flex items-center justify-center w-12 h-12 bg-cyan-700 text-slate-500 rounded-full mx-0'>
                <Button
                  type='link'
                  onClick={handleNext}
                  className='text-white'
                  shape='circle'
                  icon={<ChevronRight />}
                  disabled={currentQuestion === questions.length - 1}
                />
              </div>
              <div className='pb-10 md:px-20'>
                <div className='font-medium text-lg mb-3'>{questions[currentQuestion]?.title}</div>
                <Radio.Group onChange={handleSelectOption} value={selectedOptions[currentQuestion]}>
                  <Space direction='vertical' className='flex gap-4'>
                    {questions[currentQuestion]?.answers.map((answer, index) => (
                      <Radio key={answer.id} value={index}>
                        <span className='text-base tracking-normal'>{answer.answer}</span>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex justify-center items-center min-h-screen'>
          <Spin size='large' />
        </div>
      )}
    </div>
  );
};

export default Quiz;
